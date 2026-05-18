'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import {
  decryptToken,
  disconnectIntegration,
  getIntegrationByTenant,
} from '@/lib/whatsapp/integrations'
import {
  MetaApiError,
  sendTextMessage,
} from '@/lib/whatsapp/meta-client'

type ActionResult = { success: true } | { success: false; error: string }

export async function disconnectWhatsAppAction(): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  if (!session.tenantId) return { success: false, error: 'Tenant non valido' }

  try {
    // Best-effort: revoca il token su Meta. In modalità pilota non sempre è
    // disponibile l'endpoint /permissions sul user token; ignoriamo errori.
    const integration = await getIntegrationByTenant(session.tenantId)
    if (integration) {
      try {
        const token = await decryptToken(integration.id)
        if (token) {
          const url = new URL('https://graph.facebook.com/v19.0/me/permissions')
          await fetch(url.toString(), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => undefined)
        }
      } catch {
        // best-effort
      }
    }

    await disconnectIntegration(session.tenantId)
    revalidatePath('/dashboard/settings/integrazioni')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return { success: false, error: message }
  }
}

export async function sendTestMessageAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  if (!session.tenantId) return { success: false, error: 'Tenant non valido' }

  const to = (formData.get('to') as string | null)?.trim()
  if (!to) return { success: false, error: 'Numero destinatario mancante' }

  try {
    const integration = await getIntegrationByTenant(session.tenantId)
    if (!integration || integration.status !== 'connected') {
      return { success: false, error: 'Integrazione WhatsApp non connessa' }
    }

    const token = await decryptToken(integration.id)
    if (!token) return { success: false, error: 'Token non disponibile' }

    await sendTextMessage({
      token,
      phoneNumberId: integration.phone_number_id,
      to,
      body: 'Messaggio di test da filo — la tua integrazione WhatsApp Business è attiva.',
    })

    return { success: true }
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `${err.message} (code=${err.code ?? 'n/a'})`
        : err instanceof Error
          ? err.message
          : 'Errore sconosciuto'
    return { success: false, error: message }
  }
}
