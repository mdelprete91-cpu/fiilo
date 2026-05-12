import { chatJson } from '@/lib/ai/groq'
import type { WhatsappCategory, WhatsappMsgType } from '@/types/database'

export interface CategorizeAIInput {
  message_type: WhatsappMsgType
  body?: string | null
  caption?: string | null
}

export interface CategorizeAIResult {
  category: WhatsappCategory
  category_summary: string
  detected_language: string | null
}

const VALID_CATEGORIES: WhatsappCategory[] = [
  'misura',
  'ispirazione',
  'riferimento_dettaglio',
  'richiesta',
  'approvazione',
  'altro',
]

const SYSTEM_PROMPT = `Sei un assistente che classifica messaggi WhatsApp inviati dai clienti a un sarto.
Devi rispondere SOLO con un oggetto JSON valido, niente preamboli.

Categorie disponibili (scegli ESATTAMENTE una):
- "misura" — il cliente comunica misure (numeriche o testuali), aggiornamenti antropometrici, peso, altezza, taglie
- "ispirazione" — il cliente manda foto, link, descrizioni di capi che gli piacciono, idee, mood
- "riferimento_dettaglio" — il cliente specifica dettagli sartoriali (bottoni, revers, taschino, polsi, foderatura, cuciture, contrasti)
- "richiesta" — il cliente chiede qualcosa (un appuntamento, una modifica, un'informazione, un preventivo)
- "approvazione" — il cliente conferma, approva, dice "va bene", "ok", "perfetto", "procedi"
- "altro" — saluti, ringraziamenti, off-topic, messaggi non classificabili sopra

Output JSON richiesto:
{
  "category": "...",
  "category_summary": "frase italiana breve (max 60 char) che riassume il contenuto, es. 'Foto di ispirazione cappotto blu' o 'Aggiornamento misure (vita, spalle)'",
  "detected_language": "codice ISO della lingua del messaggio originale: it, en, es, fr, de, pt, ar, zh, ... (null se non determinabile)"
}

Importante:
- category_summary SEMPRE in italiano, anche se il messaggio è in un'altra lingua
- detected_language è la lingua del messaggio originale, non quella del summary
- Distinguere "richiesta" (cliente chiede) da "approvazione" (cliente conferma) anche in frasi miste
- Se il messaggio è solo media (foto/video senza testo), classifica in base alla natura attesa: foto senza caption tipicamente = ispirazione
`

interface AIResponse {
  category: string
  category_summary: string
  detected_language: string | null
}

function isAIResponse(x: unknown): x is AIResponse {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.category === 'string' &&
    typeof r.category_summary === 'string' &&
    (r.detected_language === null || typeof r.detected_language === 'string')
  )
}

/**
 * Categorizza un messaggio WhatsApp via Llama 3.3 70B (Groq).
 * Ritorna null se Groq non è disponibile, fallisce o ritorna JSON non valido.
 * Caller deve fare fallback a rule-based.
 */
export async function categorizeWithAI(
  input: CategorizeAIInput,
): Promise<CategorizeAIResult | null> {
  const text = (input.body ?? input.caption ?? '').trim()

  // Per messaggi solo media senza testo, niente AI: lasciare alla rule-based.
  if (!text && input.message_type !== 'text') {
    return null
  }

  // Per messaggi text vuoti (rarissimo): inutile chiamare AI
  if (!text) return null

  const userPrompt = `Tipo messaggio: ${input.message_type}
Contenuto: """${text}"""
${input.caption && input.caption !== input.body ? `Caption media: """${input.caption}"""` : ''}

Classifica e ritorna il JSON.`

  const result = await chatJson<AIResponse>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    isAIResponse,
    { temperature: 0.2 },
  )

  if (!result) return null

  // Sanitize category (Llama può ritornare valori non-enum)
  const category = VALID_CATEGORIES.includes(result.category as WhatsappCategory)
    ? (result.category as WhatsappCategory)
    : 'altro'

  return {
    category,
    category_summary: result.category_summary.slice(0, 120),
    detected_language: result.detected_language,
  }
}
