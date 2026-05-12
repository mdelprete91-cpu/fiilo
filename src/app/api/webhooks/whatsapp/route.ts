import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient } from '@supabase/supabase-js'
import { categorize } from '@/lib/whatsapp/categorize'
import { transcribeWhatsAppAudio } from '@/lib/whatsapp/transcribe'
import { analyzePhoto } from '@/lib/whatsapp/analyze-photo'
import { normalizePhone, phonesMatch } from '@/lib/whatsapp/normalize-phone'
import type { WhatsappMsgType } from '@/types/database'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? ''
const APP_SECRET = process.env.META_APP_SECRET ?? ''
const WA_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN ?? ''
const WA_API = 'https://graph.facebook.com/v19.0'

// Whisper restituisce nomi estesi ("italian"); il resto del prodotto si aspetta ISO.
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

// Service-role client — bypasses RLS for webhook inserts
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

  // Signature verification
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

  // Vercel termina la funzione appena ritorniamo la response, quindi un
  // fire-and-forget puro perde le chiamate AI a metà. waitUntil() dice a
  // Vercel di tenere viva la funzione finché la promise risolve, mentre
  // Meta riceve subito il 200.
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

      // Find tenant by phone_number_id
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('whatsapp_phone_number_id', phoneNumberId)
        .single()

      if (!tenant) continue

      for (const msg of value.messages ?? []) {
        if (!msg.id || !msg.from) continue

        // Avoid duplicates
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

        // Match client by phone
        const { data: clients } = await supabase
          .from('clients')
          .select('id, phone')
          .eq('tenant_id', tenant.id)
          .not('phone', 'is', null)

        const matchedClient = clients?.find((c) => phonesMatch(c.phone!, fromPhone))
        const clientId = matchedClient?.id ?? null

        // Determine message type and content
        const rawType = msg.type ?? 'text'
        const validTypes: WhatsappMsgType[] = ['text', 'image', 'audio', 'document', 'video', 'sticker']
        const messageType: WhatsappMsgType = validTypes.includes(rawType as WhatsappMsgType)
          ? (rawType as WhatsappMsgType)
          : 'text'

        let body = msg.text?.body ?? null
        const caption = msg.image?.caption ?? msg.video?.caption ?? null

        // Download media to Supabase Storage + transcribe audio
        let mediaUrl: string | null = null
        let mediaMimeType: string | null = null
        let transcriptConfidence: number | null = null
        let detectedLanguage: string | null = null

        const mediaId =
          msg.image?.id ?? msg.video?.id ?? msg.audio?.id ?? msg.document?.id ?? msg.sticker?.id
        const rawMime =
          msg.image?.mime_type ?? msg.video?.mime_type ??
          msg.audio?.mime_type ?? msg.document?.mime_type ?? msg.sticker?.mime_type

        if (mediaId && WA_TOKEN) {
          mediaMimeType = rawMime ?? null
          try {
            const metaRes = await fetch(`${WA_API}/${mediaId}`, {
              headers: { Authorization: `Bearer ${WA_TOKEN}` },
            })
            if (metaRes.ok) {
              const { url } = await metaRes.json() as { url?: string }
              if (url) {
                const mediaRes = await fetch(url, {
                  headers: { Authorization: `Bearer ${WA_TOKEN}` },
                })
                if (mediaRes.ok) {
                  const buffer = Buffer.from(await mediaRes.arrayBuffer())

                  // Trascrivi audio prima di salvare in Storage (Whisper su Groq, free)
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
                  const storagePath = `whatsapp/${tenant.id}/${mediaId}.${ext}`
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

        // Categorize (AI con fallback rule-based)
        const cat = await categorize({
          message_type: messageType,
          body: body ?? caption,
          caption,
        })

        const { data: inserted } = await supabase
          .from('whatsapp_messages')
          .insert({
            tenant_id: tenant.id,
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

        // Vision analysis per immagini — awaited così Vercel non termina
        // la funzione prima che il risultato sia salvato (waitUntil esterno
        // copre tutto il processWebhook)
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
