import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { cachedTextBlock, createMessage, DEFAULT_MODEL, extractText, isAvailable } from './anthropic'
import type { Client, WhatsappMessage } from '@/types/database'

// ─── Schema ──────────────────────────────────────────────────────────────────

const CitationSchema = z.object({
  label: z.string().min(1),
  message_id: z.string().uuid().nullable().optional(),
})

const PendingMeasurementSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  message_id: z.string().uuid().nullable().optional(),
})

const VisualReferenceSchema = z.object({
  description: z.string().min(1),
  message_id: z.string().uuid().nullable().optional(),
})

const EventSchema = z.object({
  label: z.string().min(1),
  date: z.string().nullable().optional(),
  message_id: z.string().uuid().nullable().optional(),
})

const PreferenceSchema = z.object({
  text: z.string().min(1),
  message_id: z.string().uuid().nullable().optional(),
})

export const ClientSummaryJsonSchema = z.object({
  preferences: z.array(PreferenceSchema).default([]),
  pending_measurements: z.array(PendingMeasurementSchema).default([]),
  visual_references: z.array(VisualReferenceSchema).default([]),
  events: z.array(EventSchema).default([]),
  relationship_status: z.string().min(1),
  citations: z.array(CitationSchema).default([]),
  highlights: z.string().nullable().optional(),
})

export type ClientSummaryJson = z.infer<typeof ClientSummaryJsonSchema>

export interface ClientSummaryRow {
  id: string
  tenant_id: string
  client_id: string
  summary_json: ClientSummaryJson
  summary_text: string | null
  model: string
  tokens_in: number | null
  tokens_out: number | null
  cost_cents: number | null
  source_message_count: number
  last_message_sent_at: string | null
  generated_at: string
  generated_by: string | null
}

// ─── Pricing (USD per million tokens) Haiku 4.5 ─────────────────────────────
// $1 input / $5 output per 1M tokens.
const PRICE_IN_PER_MTOK_USD = 1
const PRICE_OUT_PER_MTOK_USD = 5

function costInCents(tokensIn: number, tokensOut: number): number {
  const inUsd = (tokensIn / 1_000_000) * PRICE_IN_PER_MTOK_USD
  const outUsd = (tokensOut / 1_000_000) * PRICE_OUT_PER_MTOK_USD
  // restituisce centesimi USD con 4 decimali di precisione
  return Number(((inUsd + outUsd) * 100).toFixed(4))
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sei un assistente di un sarto italiano artigianale. Riassumi cosa sappiamo del cliente sulla base dei suoi messaggi WhatsApp, in modo che il sarto possa capire al volo chi ha davanti.

Devi estrarre:
- **preferences**: preferenze esplicite o ricorrenti (stili, colori, tessuti, dettagli che piacciono o no).
- **pending_measurements**: misure menzionate nei messaggi MA che non sono ancora state formalmente salvate (es. "ho preso 92 di torace", "petto 96 cm"). NON includere misure se non vengono esplicitamente citate.
- **visual_references**: descrizioni di foto/ispirazioni inviate dal cliente.
- **events**: appuntamenti, prove, consegne, date importanti citate.
- **relationship_status**: 1-2 frasi sul tono e lo stato della relazione (cliente nuovo, abituale, esigente, amichevole, in attesa di risposta, ecc.).
- **highlights**: opzionale, 1 frase di sintesi globale (tipo headline).
- **citations**: lista di claim brevi con il message_id da cui provengono (per i fact-check del sarto).

Per ogni elemento dove possibile includi il \`message_id\` esatto del messaggio sorgente (formato UUID) così il sarto può saltarci sopra.

REGOLE:
- Rispondi SOLO con JSON valido secondo lo schema fornito, niente markdown, niente prosa fuori dal JSON.
- Tono italiano professionale ma caldo, concreto, prima persona evitata.
- Mai inventare misure o dettagli che non sono nei messaggi.
- Se un campo non ha contenuto, restituiscilo come array vuoto (es. \`"events": []\`).
- Massima onestà: se i messaggi sono pochi o poco chiari, dillo in relationship_status.

Schema JSON output:
{
  "preferences":          [{"text": string, "message_id": string|null}],
  "pending_measurements": [{"label": string, "value": string, "message_id": string|null}],
  "visual_references":    [{"description": string, "message_id": string|null}],
  "events":               [{"label": string, "date": string|null, "message_id": string|null}],
  "relationship_status":  string,
  "highlights":           string|null,
  "citations":            [{"label": string, "message_id": string|null}]
}`

interface MessageForPrompt {
  id: string
  sent_at: string
  category: string
  message_type: string
  body: string | null
  photo_description: string | null
  detected_language: string | null
}

function formatMessageLine(m: MessageForPrompt): string {
  const date = m.sent_at.slice(0, 10)
  const parts: string[] = [`[${date}]`, `[${m.category}]`, `[${m.message_type}]`, `(id:${m.id})`]
  if (m.detected_language && m.detected_language.toLowerCase().slice(0, 2) !== 'it') {
    parts.push(`[lang:${m.detected_language}]`)
  }
  const text = (m.body ?? '').trim()
  let line = parts.join(' ')
  if (text) line += ` ${text}`
  if (m.photo_description) line += ` — FOTO: ${m.photo_description}`
  return line
}

function buildUserMessage(opts: {
  client: Client
  messages: MessageForPrompt[]
  previousSummary: ClientSummaryRow | null
}): string {
  const { client, messages, previousSummary } = opts

  const lines: string[] = []
  lines.push('=== CLIENTE ===')
  lines.push(`Nome: ${client.first_name} ${client.last_name}`)
  if (client.email) lines.push(`Email: ${client.email}`)
  if (client.phone) lines.push(`Telefono: ${client.phone}`)
  if (client.city) lines.push(`Città: ${client.city}`)
  if (client.notes) lines.push(`Note interne: ${client.notes}`)
  lines.push('')

  if (previousSummary) {
    lines.push(`=== SINTESI PRECEDENTE — del ${previousSummary.generated_at} ===`)
    lines.push('Usala come base ma aggiornala con i nuovi messaggi qui sotto.')
    lines.push(JSON.stringify(previousSummary.summary_json, null, 2))
    lines.push('')
  }

  lines.push(`=== MESSAGGI WHATSAPP (${messages.length}, in ordine cronologico) ===`)
  if (messages.length === 0) {
    lines.push('Nessun messaggio WhatsApp disponibile per questo cliente.')
  } else {
    for (const m of messages) lines.push(formatMessageLine(m))
  }
  lines.push('')
  lines.push('Genera ora la sintesi JSON secondo lo schema.')

  return lines.join('\n')
}

// ─── Fetching ────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 80

async function fetchData(opts: { clientId: string; tenantId: string }): Promise<{
  client: Client
  messages: MessageForPrompt[]
  rawMessages: WhatsappMessage[]
  previousSummary: ClientSummaryRow | null
}> {
  const supabase = await createClient()

  const [clientRes, messagesRes, summaryRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('id', opts.clientId)
      .eq('tenant_id', opts.tenantId)
      .single(),
    supabase
      .from('whatsapp_messages')
      .select(
        'id, sent_at, category, message_type, body, photo_analysis, detected_language',
      )
      .eq('client_id', opts.clientId)
      .eq('tenant_id', opts.tenantId)
      .order('sent_at', { ascending: false })
      .limit(MAX_MESSAGES),
    supabase
      .from('client_summaries')
      .select('*')
      .eq('client_id', opts.clientId)
      .eq('tenant_id', opts.tenantId)
      .maybeSingle(),
  ])

  if (clientRes.error || !clientRes.data) {
    throw new Error(`Cliente non trovato: ${clientRes.error?.message ?? 'unknown'}`)
  }

  const rawMessages = (messagesRes.data ?? []) as unknown as Array<
    Pick<
      WhatsappMessage,
      'id' | 'sent_at' | 'category' | 'message_type' | 'body' | 'photo_analysis' | 'detected_language'
    >
  >

  // reverse: il fetch è DESC, ma vogliamo passare al modello in ordine cronologico ASC.
  const ordered = [...rawMessages].reverse()

  const messages: MessageForPrompt[] = ordered.map((m) => ({
    id: m.id,
    sent_at: m.sent_at,
    category: m.category,
    message_type: m.message_type,
    body: m.body,
    photo_description:
      (m.photo_analysis as { description?: string | null } | null)?.description ?? null,
    detected_language: m.detected_language,
  }))

  return {
    client: clientRes.data as Client,
    messages,
    rawMessages: rawMessages as unknown as WhatsappMessage[],
    previousSummary: (summaryRes.data as ClientSummaryRow | null) ?? null,
  }
}

// ─── JSON parsing ────────────────────────────────────────────────────────────

function tryParseSummary(text: string): ClientSummaryJson | null {
  // Strip eventuali fence ```json ... ``` se Claude li mette per errore.
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  try {
    const parsed = JSON.parse(cleaned)
    const result = ClientSummaryJsonSchema.safeParse(parsed)
    if (result.success) return result.data
    console.warn('[client-summary] Zod validation failed:', result.error.issues.slice(0, 3))
    return null
  } catch (err) {
    console.warn('[client-summary] JSON parse failed:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────

export interface GenerateSummaryResult {
  row: ClientSummaryRow
  cached: boolean
}

export async function generateClientSummary(opts: {
  clientId: string
  tenantId: string
  userId: string
}): Promise<GenerateSummaryResult> {
  if (!isAvailable()) {
    throw new Error('Anthropic API non configurato (manca ANTHROPIC_API_KEY).')
  }

  const { client, messages, rawMessages, previousSummary } = await fetchData({
    clientId: opts.clientId,
    tenantId: opts.tenantId,
  })

  const systemBlocks = [cachedTextBlock(SYSTEM_PROMPT, '1h')]
  const userPrompt = buildUserMessage({ client, messages, previousSummary })

  // 1° tentativo
  let response = await createMessage({
    system: systemBlocks,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 1500,
    model: DEFAULT_MODEL,
    user_id: opts.userId,
  })

  if (!response) {
    throw new Error('Errore durante la chiamata ad Anthropic. Riprova tra qualche secondo.')
  }

  let raw = extractText(response)
  let parsed = tryParseSummary(raw)

  // 1 retry con correttivo se il JSON non è valido
  if (!parsed) {
    response = await createMessage({
      system: systemBlocks,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            'Il tuo output non è JSON valido secondo lo schema. Restituisci ORA SOLO il JSON corretto (niente prosa, niente markdown).',
        },
      ],
      max_tokens: 1500,
      model: DEFAULT_MODEL,
      user_id: opts.userId,
    })
    if (!response) {
      throw new Error('Retry Anthropic fallito.')
    }
    raw = extractText(response)
    parsed = tryParseSummary(raw)
    if (!parsed) {
      throw new Error('Anthropic non ha restituito JSON valido dopo retry.')
    }
  }

  // Totale token input = input + cache_creation + cache_read
  const tokensIn =
    response.usage.input_tokens +
    (response.usage.cache_creation_input_tokens ?? 0) +
    (response.usage.cache_read_input_tokens ?? 0)
  const tokensOut = response.usage.output_tokens
  const cost = costInCents(tokensIn, tokensOut)

  // Testo plain di servizio: prima frase relationship_status + highlights
  const summaryText = [parsed.highlights, parsed.relationship_status]
    .filter((t): t is string => Boolean(t))
    .join(' — ')

  const lastMsg = rawMessages[0] // rawMessages è DESC quindi [0] è il più recente
  const lastSentAt = lastMsg ? lastMsg.sent_at : null

  const supabase = await createClient()
  const { data: upserted, error: upsertErr } = await supabase
    .from('client_summaries')
    .upsert(
      {
        tenant_id: opts.tenantId,
        client_id: opts.clientId,
        summary_json: parsed,
        summary_text: summaryText || null,
        model: response.model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_cents: cost,
        source_message_count: messages.length,
        last_message_sent_at: lastSentAt,
        generated_by: opts.userId,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,client_id' },
    )
    .select('*')
    .single()

  if (upsertErr || !upserted) {
    throw new Error(`Upsert sintesi fallito: ${upsertErr?.message ?? 'unknown'}`)
  }

  return {
    row: upserted as ClientSummaryRow,
    cached: false,
  }
}
