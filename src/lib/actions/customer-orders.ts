'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { decryptToken, getIntegrationByTenant } from '@/lib/whatsapp/integrations'
import { sendTextMessage } from '@/lib/whatsapp/meta-client'
import type { ConfiguratoreState, ConfigStep } from '@/types/configuratore'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Crea una bozza d'ordine come customer end-user.
 * RLS impone client_id = my_client_id(); qui passiamo il client_id reale e
 * il tenant_id letto dal link client→tenant.
 */
export async function createCustomerGarmentAction(): Promise<
  ActionResult<{ id: string }>
> {
  try {
    const session = await requireRole(['customer_end_user'])
    if (!session.clientId || !session.tenantId) {
      return { success: false, error: 'Sessione cliente incompleta' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('garments')
      .insert({
        client_id: session.clientId,
        tenant_id: session.tenantId,
        type: 'suit_2pc',
        name: 'Nuovo ordine',
        status: 'draft',
        current_step: 'setup.type',
        // submitted_by_customer è false di default
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}

/**
 * Salva (autosave) la configurazione corrente di un draft cliente.
 */
export async function saveCustomerDraftAction(
  garmentId: string,
  data: { name: string; currentStep: ConfigStep; config: ConfiguratoreState },
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['customer_end_user'])
    if (!session.clientId) {
      return { success: false, error: 'Sessione cliente incompleta' }
    }
    const supabase = await createClient()

    const baseUpdate = {
      name: data.name,
      current_step: data.currentStep,
      configuration: data.config as unknown as import('@/types/database').Json,
    }
    const update = data.config.garmentType
      ? { ...baseUpdate, type: data.config.garmentType }
      : baseUpdate

    const { error } = await supabase
      .from('garments')
      .update(update)
      .eq('id', garmentId)
      .eq('client_id', session.clientId)

    if (error) return { success: false, error: error.message }
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}

/**
 * Il cliente invia l'ordine al sarto. status: draft → submitted.
 * Notifica WhatsApp al sarto (best-effort).
 */
export async function submitOrderAction(
  garmentId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['customer_end_user'])
    if (!session.clientId || !session.tenantId) {
      return { success: false, error: 'Sessione cliente incompleta' }
    }
    const supabase = await createClient()

    // 'submitted' è un nuovo valore enum aggiunto dalla migration 021 e
    // submitted_by_customer/at sono colonne nuove non ancora nei types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('garments') as any)
      .update({
        status: 'submitted',
        submitted_by_customer: true,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', garmentId)
      .eq('client_id', session.clientId)

    if (updateError) return { success: false, error: updateError.message }

    // Notifica WhatsApp al sarto (best-effort, NON blocca la submission)
    try {
      const service = await createServiceClient()
      const { data: client } = await service
        .from('clients')
        .select('first_name, last_name')
        .eq('id', session.clientId)
        .single()

      const { data: tenant } = await service
        .from('tenants')
        .select('phone, name')
        .eq('id', session.tenantId)
        .single()

      if (client && tenant?.phone) {
        const integration = await getIntegrationByTenant(session.tenantId)
        if (integration && integration.status === 'connected') {
          const wToken = await decryptToken(integration.id)
          if (wToken) {
            const body =
              `Nuova richiesta dal portale\n` +
              `Cliente: ${client.first_name} ${client.last_name}\n` +
              `Apri il gestionale per vedere il dettaglio.`
            await sendTextMessage({
              token: wToken,
              phoneNumberId: integration.phone_number_id,
              to: tenant.phone,
              body,
            })
          }
        }
      }
    } catch {
      // best-effort
    }

    revalidatePath('/dashboard/produzione')
    revalidatePath('/dashboard/panoramica')
    return { success: true, data: undefined }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}
