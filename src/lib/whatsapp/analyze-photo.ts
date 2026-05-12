import { chatJson } from '@/lib/ai/groq'

export interface PhotoAnalysis {
  /** Tipo capo rilevato (giacca, pantalone, cappotto, smoking, camicia, bottone, tessuto, dettaglio, altro). */
  garment_type: string | null
  /** Colori dominanti, max 3, in italiano (es. "blu navy", "grigio antracite"). */
  colors: string[]
  /** Pattern (tinta unita, gessato, spigato, quadri, paisley, ecc.) o null. */
  pattern: string | null
  /** Dettagli notabili (max 4 stringhe brevi: "revers a punta", "tre bottoni", ecc.). */
  details: string[]
  /** Descrizione breve in italiano (max 100 char) — usabile come category_summary arricchito. */
  description: string
}

const SYSTEM_PROMPT = `Sei un assistente sartoriale che analizza foto inviate dai clienti via WhatsApp a una sartoria su misura italiana.

Le foto possono mostrare: un capo di ispirazione (giacca, cappotto, smoking, camicia, pantalone), un campione di tessuto, un dettaglio sartoriale (bottone, revers, taschino, cucitura), una persona che indossa un capo, oppure un foglio con misure scritte a mano.

Devi rispondere SOLO con un oggetto JSON valido nel formato richiesto, in italiano.

Schema JSON:
{
  "garment_type": stringa in italiano del tipo di capo/oggetto rilevato (es. "giacca", "cappotto", "bottone", "tessuto", "campione tessuto", "dettaglio cucitura") o null se non identificabile,
  "colors": array di max 3 stringhe italiane dei colori dominanti (es. ["blu navy", "grigio antracite"]). [] se non determinabile,
  "pattern": stringa italiana del pattern del tessuto/capo ("tinta unita", "gessato", "spigato", "quadri", "principe di Galles", "paisley") o null,
  "details": array di max 4 stringhe brevi che descrivono dettagli notabili (es. ["revers a punta", "due bottoni", "polsino francese"]). [] se non rilevanti,
  "description": stringa italiana di massimo 100 caratteri che riassume il contenuto della foto in modo utile per il sarto
}

Sii specifico ma sintetico. Niente preamboli, niente markdown, solo JSON.`

function isPhotoAnalysis(x: unknown): x is PhotoAnalysis {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    (r.garment_type === null || typeof r.garment_type === 'string') &&
    Array.isArray(r.colors) &&
    (r.pattern === null || typeof r.pattern === 'string') &&
    Array.isArray(r.details) &&
    typeof r.description === 'string'
  )
}

/**
 * Analizza una foto WhatsApp via Llama Vision (Groq).
 *
 * @param imageUrl URL pubblico dell'immagine (es. Supabase Storage public URL)
 * @param caption caption opzionale del messaggio (può guidare l'AI)
 * @returns PhotoAnalysis o null se Groq non disponibile / errore
 */
export async function analyzePhoto(
  imageUrl: string,
  caption?: string | null,
): Promise<PhotoAnalysis | null> {
  const userContent: { type: string; text?: string; image_url?: { url: string } }[] = [
    {
      type: 'text',
      text: caption
        ? `Caption del cliente: "${caption}". Analizza la foto e rispondi con JSON.`
        : 'Analizza la foto e rispondi con JSON.',
    },
    { type: 'image_url', image_url: { url: imageUrl } },
  ]

  const result = await chatJson<PhotoAnalysis>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      // Groq SDK accetta content array con parts text + image_url
      { role: 'user', content: userContent as never },
    ],
    isPhotoAnalysis,
    { vision: true, temperature: 0.3, timeoutMs: 15000 },
  )

  if (!result) return null

  // Sanitize
  return {
    garment_type: result.garment_type,
    colors: result.colors.slice(0, 3).filter((c): c is string => typeof c === 'string'),
    pattern: result.pattern,
    details: result.details.slice(0, 4).filter((d): d is string => typeof d === 'string'),
    description: result.description.slice(0, 200),
  }
}
