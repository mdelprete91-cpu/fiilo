// Semantic matching: dato un nuovo tessuto, individua quali clienti del tenant
// potrebbero essere interessati sulla base delle preferenze estratte dai loro
// messaggi WhatsApp (`client_summaries.summary_json.preferences[]`).

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import {
  cachedTextBlock,
  createMessage,
  DEFAULT_MODEL,
  extractText,
  isAvailable,
} from '@/lib/ai/anthropic'
import type { Fabric } from '@/types/database'

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface FabricMatch {
  clientId: string
  clientName: string
  matchScore: number       // 0-100
  matchReason: string      // motivo breve, italiano
  suggestedMessage: string // testo del messaggio già personalizzato
}

interface CandidateRow {
  id: string
  first_name: string
  last_name: string
  preferences: string[]
}

// ─── Adminclient ─────────────────────────────────────────────────────────────

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sei un assistente di marketing per un sarto italiano artigianale.

Riceverai:
- Un nuovo tessuto (attributi: nome, brand, composizione, peso, colore, pattern, stagione)
- Un elenco di clienti, ciascuno con un array di preferenze testuali estratte dai loro messaggi WhatsApp passati

Per ciascun cliente devi:
1. Calcolare match_score (0-100) di interesse stimato per quel tessuto specifico, in base alle preferenze del cliente
2. Scrivere match_reason (max 120 caratteri) che spiega in italiano perché il tessuto potrebbe piacergli
3. Scrivere suggested_message (1-3 frasi, italiano, tono caldo, prima persona del sarto) da inviare via WhatsApp al cliente. Inserire nome di battesimo del cliente. NON includere il prezzo. NON usare emoji. Terminare con un invito a passare in sartoria o a rispondere.

REGOLE:
- Sii rigoroso sullo score: 0-30 nessuna preferenza pertinente, 40-60 generica corrispondenza, 70-85 buon match, 86-100 match eccezionale (preferenza esplicita su questa categoria)
- Se il cliente non ha preferenze nulla score ≤ 30
- Risposta SOLO in JSON valido, niente markdown, niente prosa fuori dal JSON
- Schema output:
{
  "matches": [
    {
      "client_id": string,
      "match_score": number,
      "match_reason": string,
      "suggested_message": string
    }
  ]
}`

interface ModelMatchOutput {
  client_id: string
  match_score: number
  match_reason: string
  suggested_message: string
}

const ModelOutputSchema = z.object({
  matches: z.array(
    z.object({
      client_id: z.string().uuid(),
      match_score: z.number().min(0).max(100),
      match_reason: z.string(),
      suggested_message: z.string(),
    }),
  ),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function describeFabric(f: Fabric): string {
  const parts: string[] = []
  parts.push(`nome: ${f.name}`)
  if (f.mill) parts.push(`brand: ${f.mill}`)
  if (f.composition) parts.push(`composizione: ${f.composition}`)
  if (f.weight_grams) parts.push(`peso: ${f.weight_grams} g/m²`)
  if (f.color) parts.push(`colore: ${f.color}`)
  if (f.pattern) parts.push(`pattern: ${f.pattern}`)
  if (f.season) parts.push(`stagione: ${f.season}`)
  return parts.join(', ')
}

function tryParse(text: string): { matches: ModelMatchOutput[] } | null {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  try {
    const parsed = JSON.parse(cleaned)
    const result = ModelOutputSchema.safeParse(parsed)
    if (result.success) return result.data
    console.warn('[fabric-match] Zod validation failed:', result.error.issues.slice(0, 3))
    return null
  } catch (err) {
    console.warn('[fabric-match] JSON parse failed:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export interface MatchClientsForFabricOptions {
  tenantId: string
  fabricId: string
  maxCandidates?: number  // default 30
  userId?: string
  minScore?: number       // default 70
}

export async function matchClientsForFabric(
  opts: MatchClientsForFabricOptions,
): Promise<FabricMatch[]> {
  if (!isAvailable()) {
    throw new Error('Anthropic API non configurato (manca ANTHROPIC_API_KEY).')
  }

  const supabase = adminClient()
  const maxCandidates = opts.maxCandidates ?? 30
  const minScore = opts.minScore ?? 70

  // 1) Carica fabric
  const { data: fabric, error: fabricErr } = await supabase
    .from('fabrics')
    .select('*')
    .eq('id', opts.fabricId)
    .eq('tenant_id', opts.tenantId)
    .single()

  if (fabricErr || !fabric) {
    throw new Error(`Tessuto non trovato: ${fabricErr?.message ?? 'unknown'}`)
  }

  // 2) Pre-filter clienti: marketing_optout=false, last_marketing_sent_at < 14gg
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: candidateClients, error: clientsErr } = await supabase
    .from('clients')
    .select('id, first_name, last_name, last_marketing_sent_at, marketing_optout')
    .eq('tenant_id', opts.tenantId)
    .eq('marketing_optout', false)
    .or(`last_marketing_sent_at.is.null,last_marketing_sent_at.lt.${fourteenDaysAgo}`)
    .limit(200)

  if (clientsErr) throw clientsErr
  if (!candidateClients || candidateClients.length === 0) return []

  // 3) Carica summaries per quei clienti, filtra chi NON ne ha (= zero engagement)
  const clientIds = candidateClients.map((c) => c.id)
  const { data: summaries } = await supabase
    .from('client_summaries')
    .select('client_id, summary_json')
    .eq('tenant_id', opts.tenantId)
    .in('client_id', clientIds)

  const summaryByClient = new Map<string, { preferences: Array<{ text: string }> }>()
  for (const s of summaries ?? []) {
    summaryByClient.set(s.client_id as string, s.summary_json as { preferences: Array<{ text: string }> })
  }

  const candidates: CandidateRow[] = []
  for (const c of candidateClients) {
    const sum = summaryByClient.get(c.id)
    if (!sum) continue
    const prefs = (sum.preferences ?? []).map((p) => p.text).filter(Boolean)
    if (prefs.length === 0) continue
    candidates.push({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      preferences: prefs,
    })
  }

  if (candidates.length === 0) return []

  const limited = candidates.slice(0, maxCandidates)

  // 4) UNA call Anthropic batch
  const userPayload = {
    fabric: describeFabric(fabric as Fabric),
    candidates: limited.map((c) => ({
      client_id: c.id,
      first_name: c.first_name,
      preferences: c.preferences,
    })),
  }

  const userPrompt =
    `Tessuto:\n${userPayload.fabric}\n\n` +
    `Candidati (${userPayload.candidates.length}):\n` +
    JSON.stringify(userPayload.candidates, null, 2) +
    `\n\nGenera ora il JSON secondo lo schema.`

  let response = await createMessage({
    system: [cachedTextBlock(SYSTEM_PROMPT, '1h')],
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 4000,
    model: DEFAULT_MODEL,
    user_id: opts.userId,
  })

  if (!response) {
    throw new Error('Errore durante la chiamata ad Anthropic.')
  }

  let raw = extractText(response)
  let parsed = tryParse(raw)

  if (!parsed) {
    // retry correttivo
    response = await createMessage({
      system: [cachedTextBlock(SYSTEM_PROMPT, '1h')],
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            'Output non valido. Restituisci ORA SOLO il JSON corretto secondo lo schema, niente prosa.',
        },
      ],
      max_tokens: 4000,
      model: DEFAULT_MODEL,
      user_id: opts.userId,
    })
    if (!response) throw new Error('Retry Anthropic fallito.')
    raw = extractText(response)
    parsed = tryParse(raw)
    if (!parsed) throw new Error('Anthropic non ha restituito JSON valido dopo retry.')
  }

  // 5) Mappa client_id → nome completo e filtra per score
  const nameById = new Map<string, string>()
  for (const c of limited) nameById.set(c.id, `${c.first_name} ${c.last_name}`)

  const filtered = parsed.matches
    .filter((m) => m.match_score >= minScore)
    .filter((m) => nameById.has(m.client_id))
    .sort((a, b) => b.match_score - a.match_score)
    .map<FabricMatch>((m) => ({
      clientId: m.client_id,
      clientName: nameById.get(m.client_id) ?? 'Cliente',
      matchScore: m.match_score,
      matchReason: m.match_reason,
      suggestedMessage: m.suggested_message,
    }))

  return filtered
}
