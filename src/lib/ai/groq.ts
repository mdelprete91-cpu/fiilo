import Groq from 'groq-sdk'

/**
 * Wrapper Groq + fallback Gemini per chat / JSON generation.
 *
 * Groq free tier: 30 req/min, 14.400/day, modello Llama 3.3 70B Versatile.
 * Gemini fallback opzionale (free tier 15 RPM / 1500 day) — solo se GEMINI_API_KEY è settato.
 *
 * Tutte le funzioni sono SAFE TO CALL: non lanciano eccezioni, ritornano `null` su errore.
 * Il caller decide se fare fallback rule-based.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const TEXT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct'

let _client: Groq | null = null
function client(): Groq | null {
  if (!GROQ_API_KEY) return null
  if (!_client) {
    _client = new Groq({ apiKey: GROQ_API_KEY })
  }
  return _client
}

export interface ChatOptions {
  /** Si aspetta JSON in output. Forza response_format JSON. */
  json?: boolean
  /** Temperatura, default 0.2 (deterministico per categorizzazione). */
  temperature?: number
  /** Vision request (caller deve formattare messages con image_url). */
  vision?: boolean
  /** Timeout ms, default 8000 (max che ci possiamo permettere nel webhook). */
  timeoutMs?: number
}

/**
 * Chiamata chat completion. Ritorna il content stringa o null su errore.
 *
 * `messages` segue formato OpenAI-compatible: [{role: 'system'|'user'|'assistant', content: string | parts[]}].
 */
export async function chat(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  opts: ChatOptions = {},
): Promise<string | null> {
  const g = client()
  if (!g) return null

  const { json = false, temperature = 0.2, vision = false, timeoutMs = 8000 } = opts

  try {
    const completion = await g.chat.completions.create(
      {
        model: vision ? VISION_MODEL : TEXT_MODEL,
        messages,
        temperature,
        ...(json && { response_format: { type: 'json_object' } }),
      },
      { timeout: timeoutMs },
    )
    return completion.choices[0]?.message?.content ?? null
  } catch (err) {
    console.error('[groq.chat] error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Wrapper tipizzato per JSON output. Parsa e valida via predicate user-provided.
 * Ritorna `null` se la chiamata fallisce o il JSON non è valido.
 */
export async function chatJson<T>(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  validate: (parsed: unknown) => parsed is T,
  opts: Omit<ChatOptions, 'json'> = {},
): Promise<T | null> {
  const raw = await chat(messages, { ...opts, json: true })
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (validate(parsed)) return parsed
    console.warn('[groq.chatJson] validation failed, raw:', raw.slice(0, 200))
    return null
  } catch (err) {
    console.warn('[groq.chatJson] JSON parse failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Trascrive un audio file. Usa Whisper Large V3 Turbo via Groq.
 *
 * @param audioBuffer Buffer dell'audio (m4a/mp3/ogg/wav supportati)
 * @param filename nome del file (estensione importante per Whisper)
 * @param mimeType opzionale, settato sul File così Whisper riconosce il formato
 * @returns oggetto { text, language, durationSec } o null su errore
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  mimeType?: string | null,
): Promise<{ text: string; language: string | null; durationSec: number | null } | null> {
  const g = client()
  if (!g) {
    console.warn('[groq.transcribeAudio] skipped: GROQ_API_KEY not set')
    return null
  }

  try {
    const file = new File([new Uint8Array(audioBuffer)], filename, {
      type: mimeType ?? 'audio/ogg',
    })
    const transcription = await g.audio.transcriptions.create(
      {
        file,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
      },
      { timeout: 20000 },
    )
    // verbose_json returns { text, language, duration, segments, ... }
    const t = transcription as unknown as {
      text?: string
      language?: string
      duration?: number
    }
    const text = (t.text ?? '').trim()
    console.log(
      `[groq.transcribeAudio] ok: ${text.length} chars, lang=${t.language ?? '?'}, dur=${t.duration ?? '?'}s, mime=${mimeType ?? '?'}`,
    )
    return {
      text,
      language: t.language ?? null,
      durationSec: t.duration ?? null,
    }
  } catch (err) {
    console.error(
      '[groq.transcribeAudio] error:',
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    )
    return null
  }
}

/** True se Groq API key è configurato. Caller può saltare AI se false. */
export function isAvailable(): boolean {
  return Boolean(GROQ_API_KEY)
}

/** Diagnostica per logging. Non leakare le key. */
export function status(): { groq: boolean; gemini: boolean } {
  return { groq: Boolean(GROQ_API_KEY), gemini: Boolean(GEMINI_API_KEY) }
}
