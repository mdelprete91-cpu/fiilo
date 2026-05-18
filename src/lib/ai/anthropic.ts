import Anthropic from '@anthropic-ai/sdk'
import type {
  CacheControlEphemeral,
  Message,
  MessageParam,
  TextBlockParam,
  Model,
} from '@anthropic-ai/sdk/resources/messages/messages'

/**
 * Wrapper Anthropic Messages API (Claude).
 *
 * Tutte le funzioni sono SAFE TO CALL: non lanciano eccezioni, ritornano `null` su errore.
 * Caller gestisce il fallback.
 *
 * Supporta prompt caching nativo: i blocchi system con cache_control: { type: 'ephemeral' }
 * vengono riutilizzati tra chiamate successive (cache window: 5m default, opzionale 1h).
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export const DEFAULT_MODEL: Model = 'claude-haiku-4-5'

let _client: Anthropic | null = null

export function getClient(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null
  if (!_client) {
    _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  }
  return _client
}

export function isAvailable(): boolean {
  return Boolean(ANTHROPIC_API_KEY)
}

export interface CreateMessageOptions {
  /** System prompt. Stringa o array di blocchi (per cache_control granulare). */
  system?: string | TextBlockParam[]
  /** Conversational messages. */
  messages: MessageParam[]
  /** Max tokens in output. Obbligatorio. */
  max_tokens: number
  /** Override model (default `claude-haiku-4-5`). */
  model?: Model
  /** Cache control auto-applicato all'ultimo blocco cacheable della request. */
  cache_control?: CacheControlEphemeral | null
  /** Stop sequences custom. */
  stop_sequences?: string[]
  /** Metadata (es. user_id) per rate limit / abuse detection. */
  user_id?: string
  /** Timeout ms (default 30000). */
  timeoutMs?: number
}

/**
 * Wrapper messages.create. Ritorna l'intera Message su successo, null su errore.
 *
 * Usage tokens disponibili in `message.usage.input_tokens` / `output_tokens` /
 * `cache_creation_input_tokens` / `cache_read_input_tokens`.
 */
export async function createMessage(opts: CreateMessageOptions): Promise<Message | null> {
  const client = getClient()
  if (!client) return null

  const {
    system,
    messages,
    max_tokens,
    model = DEFAULT_MODEL,
    cache_control,
    stop_sequences,
    user_id,
    timeoutMs = 30000,
  } = opts

  try {
    const response = await client.messages.create(
      {
        model,
        max_tokens,
        messages,
        ...(system !== undefined && { system }),
        ...(cache_control && { cache_control }),
        ...(stop_sequences && { stop_sequences }),
        ...(user_id && { metadata: { user_id } }),
      },
      { timeout: timeoutMs },
    )
    return response
  } catch (err) {
    console.error(
      '[anthropic.createMessage] error:',
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    )
    return null
  }
}

/**
 * Estrae il testo combinato dai blocchi di output di una Message.
 * Concatena tutti i blocchi `text`; ignora altri tipi (tool_use, thinking, ...).
 */
export function extractText(message: Message): string {
  const parts: string[] = []
  for (const block of message.content) {
    if (block.type === 'text') parts.push(block.text)
  }
  return parts.join('').trim()
}

/** Helper: costruisce un blocco testo con cache_control ephemeral. */
export function cachedTextBlock(text: string, ttl: '5m' | '1h' = '5m'): TextBlockParam {
  return {
    type: 'text',
    text,
    cache_control: { type: 'ephemeral', ttl },
  }
}

/** Diagnostica. Non leakare la key. */
export function status(): { anthropic: boolean } {
  return { anthropic: Boolean(ANTHROPIC_API_KEY) }
}
