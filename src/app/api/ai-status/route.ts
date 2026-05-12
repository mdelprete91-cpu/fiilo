import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { chat, status, isAvailable } from '@/lib/ai/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai-status — diagnostica AI in produzione.
 * Testa: chat (Llama 3.3), vision (Llama 4 Maverick), schema DB photo_analysis.
 */
export async function GET() {
  const keys = status()
  const result: Record<string, unknown> = { keys }

  if (!isAvailable()) {
    return NextResponse.json({
      ...result,
      chat_ping: { ok: false, error: 'GROQ_API_KEY not set' },
      vision_ping: { ok: false, error: 'GROQ_API_KEY not set' },
    })
  }

  // Test 1: chat (Llama 3.3)
  const chatStart = Date.now()
  let chatReply: string | null = null
  let chatError: string | null = null
  try {
    chatReply = await chat(
      [
        { role: 'system', content: 'Reply with exactly: ok' },
        { role: 'user', content: 'ping' },
      ],
      { temperature: 0, timeoutMs: 5000 },
    )
    if (chatReply === null) chatError = 'returned null (see server logs)'
  } catch (err) {
    chatError = err instanceof Error ? err.message : String(err)
  }
  result.chat_ping = {
    ok: chatReply !== null && chatReply.toLowerCase().includes('ok'),
    ms: Date.now() - chatStart,
    reply: chatReply?.slice(0, 80) ?? null,
    error: chatError,
  }

  // Test 2: vision (Llama 4 Maverick) — usa una immagine pubblica reale
  const visionStart = Date.now()
  let visionOk = false
  let visionError: string | null = null
  let visionReply: string | null = null
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create(
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Reply with exactly one word describing this image.' },
              {
                type: 'image_url',
                image_url: { url: 'https://www.fiilo.it/og.jpg' },
              },
            ],
          },
        ],
        temperature: 0,
      },
      { timeout: 10000 },
    )
    visionReply = completion.choices[0]?.message?.content ?? null
    visionOk = visionReply !== null && visionReply.trim().length > 0
  } catch (err) {
    visionError = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }
  result.vision_ping = {
    ok: visionOk,
    ms: Date.now() - visionStart,
    reply: visionReply?.slice(0, 80) ?? null,
    error: visionError,
  }

  // Test 3: DB column photo_analysis exists?
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { error } = await sb
      .from('whatsapp_messages')
      .select('photo_analysis')
      .limit(1)
    result.db_photo_analysis_column = {
      ok: !error,
      error: error?.message ?? null,
    }
  } catch (err) {
    result.db_photo_analysis_column = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  return NextResponse.json(result)
}
