'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { generateClientSummary, type ClientSummaryRow } from '@/lib/ai/client-summary'

const DAILY_LIMIT_PER_TENANT = 20

export type RegenerateResult =
  | { success: true; row: ClientSummaryRow }
  | { success: false; error: string }

export async function regenerateSummary(formData: FormData): Promise<RegenerateResult> {
  const clientId = (formData.get('clientId') as string | null)?.trim()
  if (!clientId) return { success: false, error: 'clientId mancante.' }

  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tenantId = session.tenantId
  if (!tenantId) return { success: false, error: 'Tenant non disponibile.' }

  const supabase = await createClient()

  // Rate limit: max N generazioni nelle ultime 24h per tenant.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: countLast24h } = await supabase
    .from('client_summaries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gt('generated_at', since)

  if ((countLast24h ?? 0) >= DAILY_LIMIT_PER_TENANT) {
    return {
      success: false,
      error: `Limite di ${DAILY_LIMIT_PER_TENANT} sintesi/giorno raggiunto. Riprova domani.`,
    }
  }

  try {
    const { row } = await generateClientSummary({
      clientId,
      tenantId,
      userId: session.id,
    })
    revalidatePath(`/dashboard/clienti/${clientId}`)
    return { success: true, row }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    console.error('[regenerateSummary] error:', msg)
    return { success: false, error: msg }
  }
}

export async function getSummary(clientId: string): Promise<ClientSummaryRow | null> {
  const session = await requireRole(['tenant_admin', 'tenant_staff']).catch(() => null)
  if (!session?.tenantId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('client_summaries')
    .select('*')
    .eq('client_id', clientId)
    .eq('tenant_id', session.tenantId)
    .maybeSingle()

  return (data as ClientSummaryRow | null) ?? null
}

/**
 * Conta i messaggi WhatsApp del cliente arrivati dopo la sintesi precedente.
 * Usato per decidere se mostrare il badge "X nuovi messaggi".
 */
export async function countNewMessagesSinceSummary(opts: {
  clientId: string
  lastMessageSentAt: string | null
}): Promise<number> {
  const session = await requireRole(['tenant_admin', 'tenant_staff']).catch(() => null)
  if (!session?.tenantId) return 0

  const supabase = await createClient()
  let query = supabase
    .from('whatsapp_messages')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', session.tenantId)
    .eq('client_id', opts.clientId)

  if (opts.lastMessageSentAt) {
    query = query.gt('sent_at', opts.lastMessageSentAt)
  }

  const { count } = await query
  return count ?? 0
}
