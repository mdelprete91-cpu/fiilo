'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { generateCampaignDraft } from '@/lib/newsletter/generate'
import { sendNewsletterEmail } from '@/lib/newsletter/send-email'
import type { ActionResult } from './auth'
import type {
  NewsletterCampaignRow,
  NewsletterOccasion,
  NewsletterRecipientRow,
} from '@/lib/newsletter/types'

const CreateDraftSchema = z.object({
  title: z.string().min(2, 'Il titolo è obbligatorio').max(200),
  occasion: z.enum(['new_fabric', 'seasonal', 'event', 'custom']),
  featured_fabric_id: z.string().uuid().optional().or(z.literal('')),
})

/**
 * Crea una nuova campagna in stato 'draft' e genera le copy personalizzate
 * per ogni destinatario. Operazione lunga (~1 chiamata LLM per recipient).
 *
 * Solo `tenant_admin` / `tenant_staff`.
 */
export async function createDraftAction(
  formData: FormData,
): Promise<ActionResult & { campaignId?: string }> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId
  if (!tid) return { success: false, error: 'Tenant non disponibile.' }

  const parsed = CreateDraftSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dati non validi',
    }
  }

  try {
    const result = await generateCampaignDraft({
      tenantId: tid,
      title: parsed.data.title,
      occasion: parsed.data.occasion as NewsletterOccasion,
      featuredFabricId:
        parsed.data.featured_fabric_id && parsed.data.featured_fabric_id !== ''
          ? parsed.data.featured_fabric_id
          : undefined,
      userId: session.id,
    })

    revalidatePath('/dashboard/marketing')
    redirect(`/dashboard/marketing/${result.campaignId}`)
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err
    // Lascia propagare i redirect di Next
    if (
      err != null &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest?: string }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw err
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Errore creazione campagna',
    }
  }
}

/**
 * Approva la bozza e invia a tutti i destinatari in stato 'pending'.
 *
 * Implementazione synchronous (no queue): chiamata sequenziale con throttle
 * 100ms tra i send. Per audience > ~200 il timeout di una server action può
 * essere un problema; in MVP accettiamo il limite (max_recipients default 500).
 */
export async function approveAndSendAction(
  campaignId: string,
): Promise<ActionResult & { sent?: number; failed?: number }> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId
  if (!tid) return { success: false, error: 'Tenant non disponibile.' }

  const supabase = await createClient()

  // 1. Carica campagna
  const campRes = await (
    supabase.from('newsletter_campaigns') as unknown as {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          eq: (k: string, v: unknown) => {
            single: () => Promise<{
              data: NewsletterCampaignRow | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  )
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tid)
    .single()

  if (campRes.error || !campRes.data) {
    return {
      success: false,
      error: campRes.error?.message ?? 'Campagna non trovata',
    }
  }
  const campaign = campRes.data
  if (campaign.status !== 'draft' && campaign.status !== 'approved') {
    return {
      success: false,
      error: `Stato non valido per invio: ${campaign.status}`,
    }
  }

  // 2. Set status='sending'
  await (
    supabase.from('newsletter_campaigns') as unknown as {
      update: (v: { status: string }) => {
        eq: (k: string, v: unknown) => Promise<{ error: unknown }>
      }
    }
  )
    .update({ status: 'sending' })
    .eq('id', campaignId)

  // 3. Carica recipients + tenant
  const [recipientsRes, tenantRes] = await Promise.all([
    (
      supabase.from('newsletter_recipients') as unknown as {
        select: (q: string) => {
          eq: (k: string, v: unknown) => {
            eq: (k: string, v: unknown) => Promise<{
              data: Array<
                NewsletterRecipientRow & { clients: { email: string | null } | null }
              > | null
              error: { message: string } | null
            }>
          }
        }
      }
    )
      .select('*, clients!inner(email)')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending'),
    supabase
      .from('tenants')
      .select('name, email')
      .eq('id', tid)
      .single(),
  ])

  if (recipientsRes.error) {
    return {
      success: false,
      error: `Errore lettura recipients: ${recipientsRes.error.message}`,
    }
  }

  const recipients = recipientsRes.data ?? []
  const tenantName = tenantRes.data?.name ?? 'Sartoria'
  const tenantReplyTo = tenantRes.data?.email ?? undefined

  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const to = r.clients?.email
    if (!to || !r.rendered_subject || !r.rendered_body) {
      await markRecipientFailed(supabase, r.id, 'Email o contenuto mancante')
      failed++
      continue
    }

    const unsubscribeUrl = extractUnsubscribeUrlFromHtml(r.rendered_body)

    const res = await sendNewsletterEmail({
      to,
      subject: r.rendered_subject,
      html: r.rendered_body,
      unsubscribeUrl,
      fromName: tenantName,
      replyTo: tenantReplyTo,
    })

    if (res.error || !res.id) {
      await markRecipientFailed(
        supabase,
        r.id,
        res.error ?? 'Errore invio sconosciuto',
      )
      failed++
    } else {
      await (
        supabase.from('newsletter_recipients') as unknown as {
          update: (v: {
            status: string
            sent_at: string
            resend_message_id: string
          }) => {
            eq: (k: string, v: unknown) => Promise<{ error: unknown }>
          }
        }
      )
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_message_id: res.id,
        })
        .eq('id', r.id)

      // Aggiorna last_sent_at preferenze (throttle 30 giorni)
      await (
        supabase.from('newsletter_preferences') as unknown as {
          update: (v: { last_sent_at: string }) => {
            eq: (k: string, v: unknown) => Promise<{ error: unknown }>
          }
        }
      )
        .update({ last_sent_at: new Date().toISOString() })
        .eq('client_id', r.client_id)

      sent++
    }

    // Throttle 100ms tra invii (Resend free tier: 2 req/s)
    await sleep(100)
  }

  // 4. Update campagna finale
  await (
    supabase.from('newsletter_campaigns') as unknown as {
      update: (v: {
        status: string
        sent_at: string
        sent_count: number
      }) => {
        eq: (k: string, v: unknown) => Promise<{ error: unknown }>
      }
    }
  )
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sent,
    })
    .eq('id', campaignId)

  revalidatePath(`/dashboard/marketing/${campaignId}`)
  revalidatePath('/dashboard/marketing')

  return { success: true, sent, failed }
}

/**
 * Annulla una campagna (solo se non già 'sent').
 */
export async function cancelCampaignAction(
  campaignId: string,
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId
  if (!tid) return { success: false, error: 'Tenant non disponibile.' }

  const supabase = await createClient()

  const campRes = await (
    supabase.from('newsletter_campaigns') as unknown as {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          eq: (k: string, v: unknown) => {
            single: () => Promise<{
              data: { status: string } | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  )
    .select('status')
    .eq('id', campaignId)
    .eq('tenant_id', tid)
    .single()

  if (campRes.error || !campRes.data) {
    return {
      success: false,
      error: campRes.error?.message ?? 'Campagna non trovata',
    }
  }
  if (campRes.data.status === 'sent') {
    return { success: false, error: 'Campagna già inviata, impossibile annullare.' }
  }
  if (campRes.data.status === 'cancelled') {
    return { success: true }
  }

  const updRes = await (
    supabase.from('newsletter_campaigns') as unknown as {
      update: (v: { status: string }) => {
        eq: (k: string, v: unknown) => {
          eq: (k: string, v: unknown) => Promise<{
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .update({ status: 'cancelled' })
    .eq('id', campaignId)
    .eq('tenant_id', tid)

  if (updRes.error) {
    return { success: false, error: updRes.error.message }
  }

  revalidatePath(`/dashboard/marketing/${campaignId}`)
  revalidatePath('/dashboard/marketing')
  return { success: true }
}

// ─── helpers ──────────────────────────────────────────────────

async function markRecipientFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recipientId: string,
  error: string,
): Promise<void> {
  await (
    supabase.from('newsletter_recipients') as unknown as {
      update: (v: {
        status: string
        error_message: string
      }) => {
        eq: (k: string, v: unknown) => Promise<{ error: unknown }>
      }
    }
  )
    .update({ status: 'failed', error_message: error })
    .eq('id', recipientId)
}

function extractUnsubscribeUrlFromHtml(html: string): string {
  // Cerca l'href della anchor "Annulla iscrizione" già inserita dal renderer.
  const match = html.match(/href="([^"]+\/api\/newsletter\/unsubscribe[^"]+)"/)
  if (match?.[1])
    return match[1].replace(/&amp;/g, '&')
  // Fallback: home url
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fiilo.it'}/api/newsletter/unsubscribe`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
