'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { ClientSchema, MeasurementSchema, parseNewsletterOptIn } from '@/lib/validations/client'
import type { ActionResult } from './auth'

// ─── Clienti ─────────────────────────────────────────────────

export async function createClientQuietAction(
  first_name: string,
  last_name: string,
  phone?: string,
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: session.tenantId!,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
    })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  // Crea la riga newsletter_preferences (opt-in OFF di default per GDPR).
  // Best-effort: se la migration 022 non è applicata, non interrompiamo il flow.
  await ensureNewsletterPreferences(supabase, session.tenantId!, data.id, false)
  revalidatePath('/dashboard/clienti')
  return { success: true, data: { id: data.id } }
}

/**
 * Helper: crea la riga newsletter_preferences se non esiste.
 * Best-effort — non lancia se la migration 022 non è applicata.
 */
async function ensureNewsletterPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  clientId: string,
  emailOptIn: boolean,
): Promise<void> {
  try {
    await (
      supabase.from('newsletter_preferences') as unknown as {
        upsert: (
          v: {
            client_id: string
            tenant_id: string
            email_opted_in: boolean
          },
          opts: { onConflict: string; ignoreDuplicates?: boolean },
        ) => Promise<{ error: { message: string } | null }>
      }
    ).upsert(
      {
        client_id: clientId,
        tenant_id: tenantId,
        email_opted_in: emailOptIn,
      },
      { onConflict: 'client_id' },
    )
  } catch (err) {
    // Silenziato: la migration 022 potrebbe non essere ancora applicata.
    console.warn(
      '[ensureNewsletterPreferences] best-effort failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()

  const nullify = (v: string | undefined) => (v === '' || v === undefined ? null : v)

  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: tid,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: nullify(parsed.data.email),
      phone: nullify(parsed.data.phone),
      date_of_birth: nullify(parsed.data.date_of_birth),
      address: nullify(parsed.data.address),
      city: nullify(parsed.data.city),
      country: nullify(parsed.data.country),
      notes: nullify(parsed.data.notes),
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Newsletter preferences (opt-in via checkbox, default off)
  await ensureNewsletterPreferences(
    supabase,
    tid,
    data.id,
    parseNewsletterOptIn(parsed.data.newsletter_email_opt_in),
  )

  revalidatePath('/dashboard/clienti')
  redirect(`/dashboard/clienti/${data.id}`)
}

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const nullify = (v: string | undefined) => (v === '' || v === undefined ? null : v)

  const { error } = await supabase
    .from('clients')
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: nullify(parsed.data.email),
      phone: nullify(parsed.data.phone),
      date_of_birth: nullify(parsed.data.date_of_birth),
      address: nullify(parsed.data.address),
      city: nullify(parsed.data.city),
      country: nullify(parsed.data.country),
      notes: nullify(parsed.data.notes),
    })
    .eq('id', clientId)
    .eq('tenant_id', tid)

  if (error) return { success: false, error: error.message }

  // Aggiorna preferenza newsletter (upsert: crea se mancante, aggiorna email_opted_in)
  await ensureNewsletterPreferences(
    supabase,
    tid,
    clientId,
    parseNewsletterOptIn(parsed.data.newsletter_email_opt_in),
  )

  revalidatePath(`/dashboard/clienti/${clientId}`)
  return { success: true }
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const tid = session.tenantId!

  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('tenant_id', tid)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti')
}

// ─── Misure ─────────────────────────────────────────────────

export async function createMeasurementAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = MeasurementSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('client_measurements').insert({
    tenant_id: tid,
    client_id: clientId,
    taken_by: session.id,
    ...parsed.data,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/clienti/${clientId}`)
  return { success: true }
}
