// Pipeline di invio annuncio di un tessuto via WhatsApp template a clienti
// selezionati. Gestisce cap mensile, upload immagine una sola volta, sleep
// tra invii (rate-limit Meta) e aggiornamento contatori.

import { createClient } from '@supabase/supabase-js'
import {
  decryptToken,
  getIntegrationByTenant,
} from '@/lib/whatsapp/integrations'
import {
  sendTemplateMessageWithComponents,
  MetaApiError,
} from '@/lib/whatsapp/meta-client'
import { uploadFabricImage } from '@/lib/whatsapp/media-upload'
import { getApprovedTemplate } from '@/lib/whatsapp/templates'

const TEMPLATE_NAME = 'fabric_announcement_it'
const TEMPLATE_LANGUAGE = 'it'
const RATE_LIMIT_SLEEP_MS = 1000

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export interface SendFabricAnnouncementsResult {
  sent: number
  failed: number
  errors: Array<{ clientId: string; error: string }>
}

export interface SendFabricAnnouncementsOptions {
  tenantId: string
  fabricId: string
  selectedClientIds: string[]
  userId: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// Estrae le prime 3 variabili di body usate nel template:
//   {{1}} = nome cliente, {{2}} = nome tessuto, {{3}} = motivo del match
// Manteniamo la stessa logica anche se il sarto edita il `message_body` —
// useremo `message_body` come "match_reason expanded" (3a variabile).
function buildBodyParams(opts: {
  clientFirstName: string
  fabricName: string
  matchReason: string
}): string[] {
  return [
    opts.clientFirstName,
    opts.fabricName,
    opts.matchReason.trim() || ' ',
  ]
}

export async function sendFabricAnnouncements(
  opts: SendFabricAnnouncementsOptions,
): Promise<SendFabricAnnouncementsResult> {
  const supabase = adminClient()
  const errors: Array<{ clientId: string; error: string }> = []
  let sent = 0
  let failed = 0

  // 1) Verifica settings marketing tenant (cap + flag)
  await ensureMarketingSettings(opts.tenantId)
  const { data: settings, error: settingsErr } = await supabase
    .from('tenant_marketing_settings')
    .select('*')
    .eq('tenant_id', opts.tenantId)
    .single()

  if (settingsErr || !settings) {
    throw new Error('Impossibile leggere tenant_marketing_settings.')
  }
  if (!settings.marketing_enabled) {
    throw new Error('Marketing WhatsApp disabilitato per questo tenant.')
  }

  // reset contatore se cap_reset_at è passato
  if (new Date(settings.cap_reset_at).getTime() < Date.now()) {
    await supabase
      .from('tenant_marketing_settings')
      .update({
        current_month_sent: 0,
        cap_reset_at: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          1,
        ).toISOString(),
      })
      .eq('tenant_id', opts.tenantId)
    settings.current_month_sent = 0
  }

  const remainingCap = settings.monthly_cap - settings.current_month_sent
  if (remainingCap <= 0) {
    throw new Error(
      `Cap mensile raggiunto (${settings.monthly_cap}). Riprova il mese prossimo.`,
    )
  }

  // 2) Verifica template approvato
  const template = await getApprovedTemplate(
    opts.tenantId,
    TEMPLATE_NAME,
    TEMPLATE_LANGUAGE,
  )
  if (!template) {
    throw new Error(
      `Template "${TEMPLATE_NAME}" non approvato per questo tenant. ` +
        `Sottomettilo via Meta Business Suite e registralo in whatsapp_message_templates.`,
    )
  }

  // 3) Integration tenant + token
  const integration = await getIntegrationByTenant(opts.tenantId)
  if (!integration || integration.status !== 'connected') {
    throw new Error('WhatsApp non connesso per questo tenant.')
  }
  const token = await decryptToken(integration.id)
  if (!token) throw new Error('Token WhatsApp non disponibile.')

  // 4) Carica fabric
  const { data: fabric, error: fabricErr } = await supabase
    .from('fabrics')
    .select('*')
    .eq('id', opts.fabricId)
    .eq('tenant_id', opts.tenantId)
    .single()
  if (fabricErr || !fabric) throw new Error('Tessuto non trovato.')

  if (!fabric.image_url) {
    throw new Error('Il tessuto non ha image_url: serve una foto per il template.')
  }

  // 5) Upload media (una sola volta)
  let mediaId: string
  try {
    mediaId = await uploadFabricImage({
      token,
      phoneNumberId: integration.phone_number_id,
      imageUrl: fabric.image_url,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'upload media fallito'
    throw new Error(`Upload foto a Meta fallito: ${msg}`)
  }

  // 6) Carica le righe fabric_announcements pendenti per i clienti selezionati
  const { data: announcements } = await supabase
    .from('fabric_announcements')
    .select('id, client_id, match_reason, message_body, status')
    .eq('tenant_id', opts.tenantId)
    .eq('fabric_id', opts.fabricId)
    .in('client_id', opts.selectedClientIds)

  const annByClient = new Map<string, {
    id: string
    match_reason: string | null
    message_body: string | null
    status: string
  }>()
  for (const a of announcements ?? []) {
    annByClient.set(a.client_id as string, {
      id: a.id as string,
      match_reason: (a.match_reason as string | null) ?? null,
      message_body: (a.message_body as string | null) ?? null,
      status: a.status as string,
    })
  }

  // 7) Carica clients con telefono
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone, marketing_optout')
    .eq('tenant_id', opts.tenantId)
    .in('id', opts.selectedClientIds)

  // 8) Loop di invio
  for (const clientId of opts.selectedClientIds) {
    if (sent >= remainingCap) {
      failed++
      errors.push({ clientId, error: 'Cap mensile raggiunto durante l\'invio.' })
      continue
    }

    const client = clients?.find((c) => c.id === clientId)
    if (!client) {
      failed++
      errors.push({ clientId, error: 'Cliente non trovato.' })
      continue
    }
    if (client.marketing_optout) {
      failed++
      errors.push({ clientId, error: 'Cliente ha disattivato il marketing.' })
      continue
    }
    if (!client.phone) {
      failed++
      errors.push({ clientId, error: 'Cliente senza numero di telefono.' })
      continue
    }

    const ann = annByClient.get(clientId)
    if (!ann) {
      failed++
      errors.push({ clientId, error: 'Nessuna preview pendente: rigenera il match.' })
      continue
    }

    const bodyParams = buildBodyParams({
      clientFirstName: client.first_name,
      fabricName: fabric.name,
      matchReason: ann.message_body ?? ann.match_reason ?? '',
    })

    try {
      const res = await sendTemplateMessageWithComponents({
        token,
        phoneNumberId: integration.phone_number_id,
        to: client.phone,
        templateName: template.name,
        language: template.language,
        headerImage: { media_id: mediaId },
        bodyParams,
      })
      const waMessageId = res.messages?.[0]?.id ?? null

      // Aggiorna annuncio
      await supabase
        .from('fabric_announcements')
        .update({
          status: 'sent',
          wa_message_id: waMessageId,
          sent_at: new Date().toISOString(),
          error: null,
        })
        .eq('id', ann.id)

      // Aggiorna cliente
      await supabase
        .from('clients')
        .update({ last_marketing_sent_at: new Date().toISOString() })
        .eq('id', clientId)
        .eq('tenant_id', opts.tenantId)

      sent++
    } catch (err) {
      const msg =
        err instanceof MetaApiError
          ? `Meta ${err.code ?? '?'}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Errore sconosciuto'
      failed++
      errors.push({ clientId, error: msg })
      await supabase
        .from('fabric_announcements')
        .update({
          status: 'failed',
          error: msg,
        })
        .eq('id', ann.id)
    }

    await sleep(RATE_LIMIT_SLEEP_MS)
  }

  // 9) Increment counter
  if (sent > 0) {
    await supabase
      .from('tenant_marketing_settings')
      .update({
        current_month_sent: settings.current_month_sent + sent,
      })
      .eq('tenant_id', opts.tenantId)
  }

  return { sent, failed, errors }
}

// Idempotente: crea la riga settings se manca.
export async function ensureMarketingSettings(tenantId: string): Promise<void> {
  const supabase = adminClient()
  await supabase
    .from('tenant_marketing_settings')
    .upsert(
      { tenant_id: tenantId },
      { onConflict: 'tenant_id', ignoreDuplicates: true },
    )
}
