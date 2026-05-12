import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth/session'
import { categorizeWithAI } from '@/lib/whatsapp/categorize-ai'
import { transcribeWhatsAppAudio } from '@/lib/whatsapp/transcribe'
import { analyzePhoto } from '@/lib/whatsapp/analyze-photo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/reprocess-message/[id]
 *
 * Re-esegue il pipeline AI (transcribe + categorize + photo analysis) su un
 * messaggio già salvato. Utile per:
 *  - recuperare messaggi pre-AI-deploy
 *  - debug: vedere ESATTAMENTE perché un messaggio è rule-based
 *  - rielaborare messaggi quando il modello viene aggiornato
 *
 * Auth: tenant_admin sul tenant del messaggio.
 *
 * Ritorna { applied, changes, errors }.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  if (!['tenant_admin', 'platform_owner'].includes(session.role)) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: msg, error: msgErr } = await supabase
    .from('whatsapp_messages')
    .select('id, tenant_id, message_type, body, media_url, media_mime_type, category, ai_processed, photo_analysis')
    .eq('id', id)
    .single()

  if (msgErr || !msg) {
    return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
  }

  // Authorization: platform_owner can reprocess any, tenant_admin only own tenant
  if (session.role === 'tenant_admin' && msg.tenant_id !== session.tenantId) {
    return NextResponse.json({ error: 'Accesso negato (tenant mismatch)' }, { status: 403 })
  }

  const changes: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  let body = msg.body
  let detectedLanguage: string | null = null

  // STEP 1: per audio, re-trascrivere se media_url presente
  if (msg.message_type === 'audio') {
    if (!msg.media_url) {
      errors.transcribe = 'media_url is null (audio non scaricato al primo arrivo, non recuperabile)'
    } else {
      try {
        const mediaRes = await fetch(msg.media_url)
        if (mediaRes.ok) {
          const buffer = Buffer.from(await mediaRes.arrayBuffer())
          const transcript = await transcribeWhatsAppAudio(
            buffer,
            msg.media_mime_type ?? null,
          )
          if (transcript && transcript.text.trim()) {
            body = transcript.text.trim()
            detectedLanguage = transcript.language
            changes.transcript = {
              text: body,
              language: transcript.language,
            }
          } else if (transcript) {
            errors.transcribe = `whisper returned empty text (lang=${transcript.language ?? '?'})`
          } else {
            errors.transcribe = 'whisper returned null (vedi server logs)'
          }
        } else {
          errors.media_download = `HTTP ${mediaRes.status} on ${msg.media_url.slice(0, 80)}`
        }
      } catch (err) {
        errors.transcribe = err instanceof Error ? err.message : String(err)
      }
    }
  }

  // STEP 2: re-categorizzare con AI
  try {
    const aiResult = await categorizeWithAI({
      message_type: msg.message_type,
      body,
      caption: null,
    })
    if (aiResult) {
      changes.category = aiResult.category
      changes.category_summary = aiResult.category_summary
      changes.detected_language = aiResult.detected_language ?? detectedLanguage
    } else {
      errors.categorize = 'AI returned null'
    }
  } catch (err) {
    errors.categorize = err instanceof Error ? err.message : String(err)
  }

  // STEP 3: per immagini, analyze photo
  let photoAnalysis: unknown = msg.photo_analysis
  if (msg.message_type === 'image' && msg.media_url && (msg.media_mime_type ?? '').startsWith('image/')) {
    try {
      const result = await analyzePhoto(msg.media_url, null)
      if (result) {
        photoAnalysis = result
        changes.photo_analysis = result
      } else {
        errors.analyze_photo = 'returned null'
      }
    } catch (err) {
      errors.analyze_photo = err instanceof Error ? err.message : String(err)
    }
  }

  // Apply changes
  const updatePayload: Record<string, unknown> = {}
  if ('transcript' in changes) updatePayload.body = body
  if ('category' in changes) updatePayload.category = changes.category
  if ('category_summary' in changes) updatePayload.category_summary = changes.category_summary
  if ('detected_language' in changes) updatePayload.detected_language = changes.detected_language
  if ('photo_analysis' in changes) updatePayload.photo_analysis = photoAnalysis
  // Marca come AI-processed se almeno una cosa è andata bene
  if (Object.keys(changes).length > 0) updatePayload.ai_processed = true

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateErr } = await supabase
      .from('whatsapp_messages')
      .update(updatePayload)
      .eq('id', msg.id)
    if (updateErr) errors.update = updateErr.message
  }

  return NextResponse.json({
    applied: Object.keys(updatePayload).length > 0,
    message_type: msg.message_type,
    had_media: Boolean(msg.media_url),
    had_body: Boolean(msg.body),
    media_mime: msg.media_mime_type,
    media_url_preview: msg.media_url ? msg.media_url.slice(0, 100) : null,
    changes,
    errors,
  })
}
