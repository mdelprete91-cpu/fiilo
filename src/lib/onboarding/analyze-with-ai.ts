/**
 * Analizza l'output di crawl-site con Claude Haiku 4.5 per estrarre
 * brand identity strutturata (logo, color, tono, nome ufficiale).
 */

import { z } from 'zod'
import { createMessage, DEFAULT_MODEL, extractText, isAvailable } from '@/lib/ai/anthropic'
import type { ExtractedMeta } from './crawl-site'

const BrandAnalysisSchema = z.object({
  logo_url: z.string().url().nullable(),
  brand_color_hex: z.string().regex(/^#[0-9A-F]{6}$/i).nullable(),
  tone_description: z.string().min(10).max(400),
  official_name: z.string().min(2).max(100),
})

export type BrandAnalysis = z.infer<typeof BrandAnalysisSchema>

export interface AnalyzeInput {
  websiteUrl: string
  meta: ExtractedMeta
}

const SYSTEM_PROMPT = `Sei un assistente che analizza il sito di una sartoria artigianale italiana. Riceverai dati estratti dal sito (meta tag, candidati logo e colori CSS, testo della homepage). Devi restituire UN SOLO oggetto JSON, senza commenti, senza markdown, senza testo aggiuntivo, con questi campi:

{
  "logo_url": "<URL completo del logo migliore tra i candidati, o null se nessuno è chiaramente il logo>",
  "brand_color_hex": "<#RRGGBB del colore identitario del brand, o null se non identificabile. NON scegliere il bianco di default (#FFFFFF) o nero puro (#000000); cerca il colore di accento del brand (orange, navy, burgundy, ecc.)>",
  "tone_description": "<1-2 frasi che descrivono lo stile e il tono di voce della sartoria in italiano. Esempio: 'Sartoria napoletana tradizionale, tono caldo e familiare, focus su artigianalità storica.'>",
  "official_name": "<Nome ufficiale della sartoria estratto da og:site_name, og:title o title. Es: 'Sartoria Scarano Napoli'>"
}

Regole:
- Preferisci og:image > favicon ad alta risoluzione > immagini con classe/id "logo"
- brand_color_hex deve essere un colore identitario (non background bianco/grigio neutro)
- Sii conciso nel tone_description; in italiano
- Mai inserire testo fuori dal JSON`

export async function analyzeBrandWithAI(input: AnalyzeInput): Promise<BrandAnalysis | null> {
  if (!isAvailable()) {
    throw new Error('Anthropic API non configurato (manca ANTHROPIC_API_KEY).')
  }

  const userMessage = `Sito analizzato: ${input.websiteUrl}

Meta tags estratti:
- og:title: ${input.meta.ogTitle ?? '(none)'}
- og:site_name: ${input.meta.ogSiteName ?? '(none)'}
- og:description: ${input.meta.ogDescription ?? '(none)'}
- og:image: ${input.meta.ogImage ?? '(none)'}
- twitter:image: ${input.meta.twitterImage ?? '(none)'}
- favicon: ${input.meta.favicon ?? '(none)'}
- theme-color: ${input.meta.themeColor ?? '(none)'}
- html lang: ${input.meta.language ?? '(none)'}

Candidati logo trovati (max 6):
${input.meta.candidateLogos.length > 0 ? input.meta.candidateLogos.map((u) => `  - ${u}`).join('\n') : '  (nessuno)'}

Colori hex più presenti nei CSS (max 20):
${input.meta.candidateColors.length > 0 ? input.meta.candidateColors.join(', ') : '(nessuno)'}

Testo della homepage (primi 2000 char):
"""
${input.meta.homepageText}
"""

Restituisci il JSON ora.`

  const response = await createMessage({
    model: DEFAULT_MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })
  if (!response) return null

  const raw = extractText(response).trim()
  let parsed: unknown
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }
  const validated = BrandAnalysisSchema.safeParse(parsed)
  if (!validated.success) return null
  return validated.data
}
