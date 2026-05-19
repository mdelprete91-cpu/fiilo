'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { requireRole } from '@/lib/auth/session'
import { matchClientsForFabric } from '@/lib/marketing/fabric-match'
import {
  sendFabricAnnouncements,
  type SendFabricAnnouncementsResult,
} from '@/lib/marketing/announce-fabric'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── previewAnnouncementAction ───────────────────────────────────────────────
// 1. Esegue il match AI
// 2. Upsert delle righe fabric_announcements in stato 'pending_review'
// 3. La pagina sarà riconvalidata e mostrerà la preview
export async function previewAnnouncementAction(
  formData: FormData,
): Promise<ActionResult<{ matchCount: number }>> {
  const fabricId = (formData.get('fabricId') as string | null)?.trim()
  if (!fabricId) return { success: false, error: 'fabricId mancante.' }

  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tenantId = session.tenantId
  if (!tenantId) return { success: false, error: 'Tenant non disponibile.' }

  try {
    const matches = await matchClientsForFabric({
      tenantId,
      fabricId,
      userId: session.id,
    })

    const supabase = adminClient()

    // Pulisci preview precedenti che NON sono ancora state inviate.
    // Manteniamo lo storico di status='sent' / 'failed'.
    await supabase
      .from('fabric_announcements')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('fabric_id', fabricId)
      .in('status', ['pending_review', 'approved', 'skipped'])

    if (matches.length > 0) {
      const rows = matches.map((m) => ({
        tenant_id: tenantId,
        fabric_id: fabricId,
        client_id: m.clientId,
        status: 'pending_review' as const,
        match_score: m.matchScore,
        match_reason: m.matchReason,
        message_body: m.suggestedMessage,
      }))

      const { error: insertErr } = await supabase
        .from('fabric_announcements')
        .upsert(rows, { onConflict: 'fabric_id,client_id' })

      if (insertErr) {
        return {
          success: false,
          error: `Impossibile salvare preview: ${insertErr.message}`,
        }
      }
    }

    revalidatePath(`/dashboard/catalogo/${fabricId}/annuncio`)
    return { success: true, data: { matchCount: matches.length } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    console.error('[previewAnnouncementAction] error:', msg)
    return { success: false, error: msg }
  }
}

// ─── sendAnnouncementAction ──────────────────────────────────────────────────
// formData:
//   fabricId: string
//   clientIds: string (CSV o JSON array)
//   message_<clientId>: string (testo personalizzato editato dal sarto)
export async function sendAnnouncementAction(
  formData: FormData,
): Promise<ActionResult<SendFabricAnnouncementsResult>> {
  const fabricId = (formData.get('fabricId') as string | null)?.trim()
  const clientIdsRaw = (formData.get('clientIds') as string | null)?.trim()

  if (!fabricId) return { success: false, error: 'fabricId mancante.' }
  if (!clientIdsRaw) return { success: false, error: 'Nessun cliente selezionato.' }

  let clientIds: string[] = []
  try {
    clientIds = JSON.parse(clientIdsRaw)
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return { success: false, error: 'clientIds non valido o vuoto.' }
    }
  } catch {
    clientIds = clientIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tenantId = session.tenantId
  if (!tenantId) return { success: false, error: 'Tenant non disponibile.' }

  // Aggiorna i message_body dalle edit inline del sarto (campo `message_<id>`)
  const supabase = adminClient()
  for (const cid of clientIds) {
    const customMsg = (formData.get(`message_${cid}`) as string | null)?.trim()
    if (customMsg) {
      await supabase
        .from('fabric_announcements')
        .update({ message_body: customMsg, status: 'approved' })
        .eq('tenant_id', tenantId)
        .eq('fabric_id', fabricId)
        .eq('client_id', cid)
    } else {
      await supabase
        .from('fabric_announcements')
        .update({ status: 'approved' })
        .eq('tenant_id', tenantId)
        .eq('fabric_id', fabricId)
        .eq('client_id', cid)
    }
  }

  try {
    const result = await sendFabricAnnouncements({
      tenantId,
      fabricId,
      selectedClientIds: clientIds,
      userId: session.id,
    })
    revalidatePath(`/dashboard/catalogo/${fabricId}/annuncio`)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    console.error('[sendAnnouncementAction] error:', msg)
    return { success: false, error: msg }
  }
}

// ─── setOptOutAction ─────────────────────────────────────────────────────────
export async function setOptOutAction(
  formData: FormData,
): Promise<ActionResult> {
  const clientId = (formData.get('clientId') as string | null)?.trim()
  const optoutRaw = (formData.get('optout') as string | null)?.trim()
  const optout = optoutRaw === 'true' || optoutRaw === '1'

  if (!clientId) return { success: false, error: 'clientId mancante.' }

  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tenantId = session.tenantId
  if (!tenantId) return { success: false, error: 'Tenant non disponibile.' }

  const supabase = adminClient()
  const { error } = await supabase
    .from('clients')
    .update({
      marketing_optout: optout,
      marketing_optout_at: optout ? new Date().toISOString() : null,
    })
    .eq('id', clientId)
    .eq('tenant_id', tenantId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/clienti/${clientId}`)
  return { success: true }
}
