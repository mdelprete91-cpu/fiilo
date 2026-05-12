import type { WhatsappCategory, WhatsappMsgType } from '@/types/database'
import { categorizeWithAI } from './categorize-ai'

interface CategorizeInput {
  message_type: WhatsappMsgType
  body?: string | null
  caption?: string | null
}

export interface CategorizeResult {
  category: WhatsappCategory
  category_summary: string
  detected_language: string | null
  /** true se la classificazione viene da AI, false se da fallback rule-based. */
  ai_processed: boolean
}

/**
 * Categorizza un messaggio WhatsApp.
 *
 * Strategia:
 * 1. Prova AI (Groq Llama 3.3 70B) — capisce frasi naturali italiane + altre lingue
 * 2. Fallback rule-based (keyword matching) se AI non disponibile o fallisce
 *
 * Sincrona dal punto di vista del caller — async perché AI può richiedere fino a 8s.
 */
export async function categorize(input: CategorizeInput): Promise<CategorizeResult> {
  const aiResult = await categorizeWithAI(input)
  if (aiResult) {
    return {
      category: aiResult.category,
      category_summary: aiResult.category_summary,
      detected_language: aiResult.detected_language,
      ai_processed: true,
    }
  }

  const rule = categorizeRuleBased(input)
  return {
    category: rule.category,
    category_summary: rule.category_summary,
    detected_language: null,
    ai_processed: false,
  }
}

// ─── Fallback rule-based (logica originale, intatta) ───

const DETAIL_KEYWORDS = ['botto', 'taschino', 'rever', 'risvolto', 'manica', 'polso', 'alamaro', 'occhiello', 'cucitura', 'contrastin', 'filetto']
const MEASURE_KEYWORDS = ['misur', 'cm', 'vita', 'spall', 'petto', 'manica', 'girovita', 'coscia', 'cavallo', 'inseam', 'fianch', 'collo', 'polso', 'altezza', 'peso']
const APPROVAL_KEYWORDS = ['ok', 'perfetto', 'confermo', 'va bene', 'approv', 'bene così', 'ottimo', 'giusto', 'sì', 'si', 'certo', 'd\'accordo', 'procedi']
const REQUEST_KEYWORDS = ['quando', 'potrebbe', 'vorrei', 'puoi', 'possiamo', 'è possibile', 'volevo', 'chiedere', 'avrei', '?']

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

interface RuleResult {
  category: WhatsappCategory
  category_summary: string
}

export function categorizeRuleBased({ message_type, body, caption }: CategorizeInput): RuleResult {
  if (message_type === 'image' || message_type === 'video') {
    const text = (caption ?? body ?? '').toLowerCase()
    if (text && matchesAny(text, DETAIL_KEYWORDS)) {
      return {
        category: 'riferimento_dettaglio',
        category_summary: 'Riferimento dettaglio ricevuto',
      }
    }
    return {
      category: 'ispirazione',
      category_summary: message_type === 'video' ? 'Video di ispirazione ricevuto' : 'Foto di ispirazione ricevuta',
    }
  }

  if (message_type === 'audio') {
    return { category: 'richiesta', category_summary: 'Messaggio vocale ricevuto' }
  }

  if (message_type === 'document') {
    return { category: 'altro', category_summary: 'Documento ricevuto' }
  }

  const text = body ?? ''

  if (matchesAny(text, MEASURE_KEYWORDS)) {
    return { category: 'misura', category_summary: 'Aggiornamento misure dal cliente' }
  }

  if (matchesAny(text, DETAIL_KEYWORDS)) {
    return { category: 'riferimento_dettaglio', category_summary: 'Riferimento dettaglio ricevuto' }
  }

  if (matchesAny(text, APPROVAL_KEYWORDS)) {
    return { category: 'approvazione', category_summary: 'Conferma/approvazione dal cliente' }
  }

  if (matchesAny(text, REQUEST_KEYWORDS)) {
    return { category: 'richiesta', category_summary: 'Richiesta dal cliente' }
  }

  return { category: 'altro', category_summary: 'Messaggio ricevuto' }
}
