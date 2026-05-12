import { NextResponse } from 'next/server'
import { chat, status, isAvailable } from '@/lib/ai/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai-status
 *
 * Endpoint diagnostico per verificare la configurazione AI in produzione.
 * Restituisce:
 *  - keys presenti (boolean, niente leak)
 *  - groq ping: chiamata test su Llama 3.3 per verificare che la key funzioni
 *
 * Pubblico ma niente dati sensibili. Da usare solo per debug.
 */
export async function GET() {
  const keys = status()

  let groqPingOk = false
  let groqPingError: string | null = null

  if (isAvailable()) {
    const start = Date.now()
    try {
      const reply = await chat(
        [
          { role: 'system', content: 'Reply with exactly the word: ok' },
          { role: 'user', content: 'ping' },
        ],
        { temperature: 0, timeoutMs: 5000 },
      )
      groqPingOk = reply !== null && reply.toLowerCase().includes('ok')
      if (!groqPingOk && reply !== null) {
        groqPingError = `unexpected reply: ${reply.slice(0, 100)}`
      } else if (reply === null) {
        groqPingError = 'chat returned null (see server logs)'
      }
    } catch (err) {
      groqPingError = err instanceof Error ? err.message : String(err)
    }
    const ms = Date.now() - start
    return NextResponse.json({
      keys,
      groq_ping: { ok: groqPingOk, ms, error: groqPingError },
    })
  }

  return NextResponse.json({
    keys,
    groq_ping: { ok: false, ms: 0, error: 'GROQ_API_KEY not set' },
  })
}
