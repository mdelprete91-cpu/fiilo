import type { WhatsappCategory, WhatsappMsgType } from '@/types/database'

interface CategorizeInput {
  message_type: WhatsappMsgType
  body?: string | null
  caption?: string | null
}

interface CategorizeResult {
  category: WhatsappCategory
  category_summary: string
}

const DETAIL_KEYWORDS = ['botto', 'taschino', 'rever', 'risvolto', 'manica', 'polso', 'alamaro', 'occhiello', 'cucitura', 'contrastin', 'filetto']
const MEASURE_KEYWORDS = ['misur', 'cm', 'vita', 'spall', 'petto', 'manica', 'girovita', 'coscia', 'cavallo', 'inseam', 'fianch', 'collo', 'polso', 'altezza', 'peso']
const APPROVAL_KEYWORDS = ['ok', 'perfetto', 'confermo', 'va bene', 'approv', 'bene così', 'ottimo', 'giusto', 'sì', 'si', 'certo', 'd\'accordo', 'procedi']
const REQUEST_KEYWORDS = ['quando', 'potrebbe', 'vorrei', 'puoi', 'possiamo', 'è possibile', 'volevo', 'chiedere', 'avrei', '?']

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

export function categorize({ message_type, body, caption }: CategorizeInput): CategorizeResult {
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

  // text
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
