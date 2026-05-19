import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient } from '@supabase/supabase-js'
import { categorize } from '@/lib/whatsapp/categorize'
import { transcribeWhatsAppAudio } from '@/lib/whatsapp/transcribe'
import { analyzePhoto } from '@/lib/whatsapp/analyze-photo'
import { phonesMatch } from '@/lib/whatsapp/normalize-phone'
import {
  decryptToken,
  getIntegrationByPhoneNumberId,
} from '@/lib/whatsapp/integrations'
import { sendTextMessage } from '@/lib/whatsapp/meta-client'
import type { WhatsappMsgType } from '@/types/database'

const OPTOUT_KEYWORDS_REGEX = /^(stop|fermati|basta|cancella|unsubscribe)\b/i

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? ''
const APP_SECRET = process.env.META_APP_SECRET ?? ''
const WA_API = 'https://graph.facebook.com/v19.0'

const LANGUAGE_TO_ISO: Record<string, string> = {
  italian: 'it', italiano: 'it',
  english: 'en',
  spanish: 'es', español: 'es',
  french: 'fr', français: 'fr',
  german: 'de', deutsch: 'de',
  portuguese: 'pt', português: 'pt',
  arabic: 'ar',
  chinese: 'zh',
}

function normalizeLanguage(lang: string | null | undefined): string | null {
  if (!lang) return null
  const l = lang.toLowerCase().trim()
  if (LANGUAGE_TO_ISO[l]) return LANGUAGE_TO_ISO[l]
  return l.length <= 3 ? l : l.slice(0, 2)
}

// Service-role client — bypasses RLS per inserire i messaggi del webhook
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── GET — Meta webhook verification ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST — Incoming messages ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (APP_SECRET) {
    const signature = req.headers.get('x-hub-signature-256') ?? ''
    const expected = `sha256=${createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`
    if (signature !== expected) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  waitUntil(
    processWebhook(payload as WebhookPayload).catch((err) =>
      console.error('[whatsapp.webhook] processing error', err),
    ),
  )

  return new NextResponse('OK', { status: 200 })
}

// ─── Processing ──────────────────────────────────────────────────────────────

interface WebhookPayload {
  object: string
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string }
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>
        messages?: Array<{
          id?: string
          from?: string
          timestamp?: string
          type?: string
          text?: { body?: string }
          image?: { id?: string; mime_type?: string; caption?: string }
          video?: { id?: string; mime_type?: string; caption?: string }
          audio?: { id?: string; mime_type?: string }
          document?: { id?: string; mime_type?: string; filename?: string }
          sticker?: { id?: string; mime_type?: string }
        }>
      }
    }>
  }>
}

async function processWebhook(payload: WebhookPayload) {
  if (payload.object !== 'whatsapp_business_account') return

  const supabase = adminClient()

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value) continue

      const phoneNumberId = value.metadata?.phone_number_id
      if (!phoneNumberId) continue

      // Risoluzione multi-tenant: phone_number_id → integration
      const integration = await getIntegrationByPhoneNumberId(phoneNumberId)
      if (!integration) {
        console.warn(
          `[whatsapp.webhook] nessuna integration per phone_number_id=${phoneNumberId}`,
        )
        continue
      }
      if (integration.status === 'revoked') {
        console.warn(
          `[whatsapp.webhook] integration revocata per tenant=${integration.tenant_id}`,
        )
        continue
      }

      const tenantId = integration.tenant_id

      // Token decifrato per scaricare media (lazy, solo se necessario)
      let waToken: string | null = null
      async function getToken(): Promise<string | null> {
        if (waToken) return waToken
        try {
          waToken = await decryptToken(integration!.id)
        } catch (err) {
          console.error('[whatsapp.webhook] decrypt token error', err)
          waToken = null
        }
        return waToken
      }

      for (const msg of value.messages ?? []) {
        if (!msg.id || !msg.from) continue

        const { count } = await supabase
          .from('whatsapp_messages')
          .select('id', { count: 'exact', head: true })
          .eq('wa_message_id', msg.id)

        if ((count ?? 0) > 0) continue

        const fromPhone = msg.from
        const fromName = value.contacts?.find((c) => c.wa_id === fromPhone)?.profile?.name ?? null
        const sentAt = msg.timestamp
          ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
          : new Date().toISOString()

        const { data: clients } = await supabase
          .from('clients')
          .select('id, phone')
          .eq('tenant_id', tenantId)
          .not('phone', 'is', null)

        const matchedClient = clients?.find((c) => phonesMatch(c.phone!, fromPhone))
        const clientId = matchedClient?.id ?? null

        // ─── Intercept STOP / opt-out keywords (text inbound only) ──────
        // Se il cliente scrive "STOP" (o sinonimi), settiamo marketing_optout=true
        // e proviamo a rispondere (siamo dentro la 24h customer-service window).
        // La logica esistente prosegue normalmente: il messaggio viene comunque
        // salvato in whatsapp_messages così resta tracciato.
        if (
          clientId &&
          (msg.type === 'text' || !msg.type) &&
          msg.text?.body &&
          OPTOUT_KEYWORDS_REGEX.test(msg.text.body.trim())
        ) {
          try {
            await supabase
              .from('clients')
              .update({
                marketing_optout: true,
                marketing_optout_at: new Date().toISOString(),
              })
              .eq('id', clientId)
              .eq('tenant_id', tenantId)

            const token = await getToken()
            if (token) {
              try {
                await sendTextMessage({
                  token,
                  phoneNumberId,
                  to: fromPhone,
                  body:
                    'Hai disattivato le comunicazioni promozionali. ' +
                    'Non riceverai più annunci di nuovi tessuti. ' +
                    'Per riattivarle, contatta il tuo sarto.',
                })
              } catch (err) {
                console.error('[whatsapp] optout reply error', err)
              }
            }
          } catch (err) {
            console.error('[whatsapp] optout update error', err)
          }
        }

        const rawType = msg.type ?? 'text'
        const validTypes: WhatsappMsgType[] = ['text', 'image', 'audio', 'document', 'video', 'sticker']
        const messageType: WhatsappMsgType = validTypes.includes(rawType as WhatsappMsgType)
          ? (rawType as WhatsappMsgType)
          : 'text'

        let body = msg.text?.body ?? null
        const caption = msg.image?.caption ?? msg.video?.caption ?? null

        let mediaUrl: string | null = null
        let mediaMimeType: string | null = null
        let transcriptConfidence: number | null = null
        let detectedLanguage: string | null = null

        const mediaId =
          msg.image?.id ?? msg.video?.id ?? msg.audio?.id ?? msg.document?.id ?? msg.sticker?.id
        const rawMime =
          msg.image?.mime_type ?? msg.video?.mime_type ??
          msg.audio?.mime_type ?? msg.document?.mime_type ?? msg.sticker?.mime_type

        if (mediaId) {
          const token = await getToken()
          if (token) {
            mediaMimeType = rawMime ?? null
            try {
              const metaRes = await fetch(`${WA_API}/${mediaId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (metaRes.ok) {
                const { url } = await metaRes.json() as { url?: string }
                if (url) {
                  const mediaRes = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  if (mediaRes.ok) {
                    const buffer = Buffer.from(await mediaRes.arrayBuffer())

                    if (messageType === 'audio') {
                      try {
                        const transcript = await transcribeWhatsAppAudio(buffer, rawMime ?? null)
                        if (transcript && transcript.text.trim()) {
                          body = transcript.text.trim()
                          detectedLanguage = normalizeLanguage(transcript.language)
                          transcriptConfidence = transcript.confidence
                        }
                      } catch (err) {
                        console.error('[whatsapp] transcribe error', err)
                      }
                    }

                    const ext = (rawMime ?? 'image/jpeg').split('/')[1]?.split(';')[0] ?? 'bin'
                    const storagePath = `whatsapp/${tenantId}/${mediaId}.${ext}`
                    const { error: uploadErr } = await supabase.storage
                      .from('assets')
                      .upload(storagePath, buffer, {
                        contentType: rawMime ?? 'application/octet-stream',
                        upsert: true,
                      })
                    if (!uploadErr) {
                      const { data: pub } = supabase.storage.from('assets').getPublicUrl(storagePath)
                      mediaUrl = pub.publicUrl
                    }
                  }
                }
              }
            } catch (err) {
              console.error('[whatsapp] media download error', err)
            }
          }
        }

        const cat = await categorize({
          message_type: messageType,
          body: body ?? caption,
          caption,
        })

        const { data: inserted } = await supabase
          .from('whatsapp_messages')
          .insert({
            tenant_id: tenantId,
            client_id: clientId,
            wa_message_id: msg.id,
            wa_phone_number_id: phoneNumberId,
            from_phone: fromPhone,
            from_name: fromName,
            message_type: messageType,
            body,
            media_url: mediaUrl,
            media_mime_type: mediaMimeType,
            category: cat.category,
            category_summary: cat.category_summary,
            detected_language: detectedLanguage ?? normalizeLanguage(cat.detected_language),
            transcript_confidence: transcriptConfidence,
            ai_processed: cat.ai_processed,
            sent_at: sentAt,
          })
          .select('id')
          .single()

        if (
          inserted?.id &&
          messageType === 'image' &&
          mediaUrl &&
          (rawMime ?? '').startsWith('image/')
        ) {
          try {
            const result = await analyzePhoto(mediaUrl, caption ?? null)
            if (result) {
              await supabase
                .from('whatsapp_messages')
                .update({ photo_analysis: result, ai_processed: true })
                .eq('id', inserted.id)
              console.log(
                `[whatsapp] photo_analysis saved for msg ${inserted.id}`,
              )
            } else {
              console.warn(
                `[whatsapp] analyzePhoto returned null for msg ${inserted.id}`,
              )
            }
          } catch (err) {
            console.error('[whatsapp] analyzePhoto error', err)
          }
        }
      }
    }
  }
}
