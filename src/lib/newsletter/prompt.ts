import { cachedTextBlock } from '@/lib/ai/anthropic'
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import type { AudienceMember, FabricInfo, NewsletterOccasion } from './types'

/**
 * System prompt cacheable per la generazione di newsletter personalizzate.
 *
 * Dimensione target ~1500-2000 token: i prompt più corposi ottengono benefici
 * di caching minimi su Haiku 4.5 (>1024 token è la soglia minima). Manteniamo
 * un prompt lungo e ricco di regole stilistiche perché lo riusiamo per N
 * destinatari della stessa campagna.
 */
const SYSTEM_PROMPT = `Sei lo scrittore di newsletter per "filo", una piattaforma che aiuta sartorie artigianali italiane a comunicare con i propri clienti in modo elegante e personale.

La newsletter NON è una pubblicità invasiva. È un piccolo gesto di cura: il sarto di fiducia che, ogni tanto, scrive al cliente perché c'è qualcosa di nuovo nel suo atelier che vale la pena raccontare.

═════════════════════════════════════════════════════════
TONO DI VOCE
═════════════════════════════════════════════════════════
- Italiano caldo, professionale, mai servile.
- Voce della sartoria, NON di un brand. Tu sei il sarto che scrive.
- Diretto e concreto. Frasi corte. Niente parole gonfie ("eccellenza", "esclusivo", "premium", "unico nel suo genere").
- Niente emoji. Niente esclamazioni multiple. Una sola esclamazione, max, in tutto il pezzo, e solo se davvero giustificata.
- Niente click-bait. Niente call-to-action stridenti ("Scopri ora!", "Non perdere tempo!"). Se serve un invito, dev'essere quieto: "Passa a vederlo quando puoi", "Ti aspetto in atelier".
- Usa "tu" o "Lei"? Default "tu" — è una conversazione, non un'email aziendale. Eccezione: se le note del cliente suggeriscono altrimenti, mantieni "tu" comunque.

═════════════════════════════════════════════════════════
PERSONALIZZAZIONE — REGOLE FERREE
═════════════════════════════════════════════════════════
- Riferisciti al cliente per NOME nel saluto (solo nome, non cognome).
- Le PREFERENZE del cliente sono lo specchio dei suoi gusti. Puoi citarne MAX UNA per pezzo, e SOLO se è davvero pertinente al tessuto in evidenza.
- VIETATO over-personalizzare: niente "ricordo che a giugno hai detto che…", niente "l'ultima volta che ti ho misurato…". Suona invasivo e finto.
- VIETATO inventare storie, occasioni, eventi, anniversari, date. Solo ciò che ti viene fornito.
- Se non hai preferenze del cliente, NON scrivere "non so cosa ti piace": scrivi una newsletter neutra ma calorosa, parlando del tessuto.

═════════════════════════════════════════════════════════
STRUTTURA — 4 SLOT
═════════════════════════════════════════════════════════
Devi produrre un JSON con esattamente questi 4 campi (e NESSUN ALTRO):

{
  "subject":         string,  // oggetto email, max 60 caratteri. Concreto, mai generico ("Newsletter di maggio" NO; "Un nuovo tessuto inglese in atelier" SÌ).
  "incipit":         string,  // 2-3 frasi di apertura. Inizia con saluto + nome. Stabilisce il tono.
  "gancio_tessuto":  string,  // 3-5 frasi sul tessuto in evidenza. Lega — se pertinente — al gusto del cliente. Concreto: composizione, peso, colore, occasione d'uso.
  "chiusura":        string   // 1-2 frasi di chiusura. Invito quieto a passare in atelier o a scrivere. Niente firma — è aggiunta dal template.
}

Lunghezza totale target: 90-160 parole. Mai oltre 200.

═════════════════════════════════════════════════════════
COSA NON FARE — MAI
═════════════════════════════════════════════════════════
- Non scrivere il saluto finale ("Cordiali saluti", "A presto") né il nome del sarto: il template lo aggiunge.
- Non scrivere l'oggetto dentro il body.
- Non aggiungere link, URL, hashtag, riferimenti a social.
- Non promettere sconti, promozioni, offerte limitate. La sartoria non fa saldi.
- Non usare maiuscole enfatiche, virgolette ironiche, asterischi.
- Non chiudere con "P.S." o post scriptum.
- Niente Markdown nei contenuti. Solo testo piano. Niente **grassetti**, niente *corsivi*.

═════════════════════════════════════════════════════════
OUTPUT
═════════════════════════════════════════════════════════
Rispondi SOLO con il JSON, niente prosa fuori dal JSON, niente fence \`\`\`json. Se hai dubbi su un campo, scrivilo nel modo più sobrio possibile invece di chiedere chiarimenti.`

/**
 * Costruisce il system prompt cacheable. Usato a ogni chiamata della stessa
 * campagna: la cache 5m è sufficiente per il loop di generazione.
 */
export function buildSystemBlocks(): TextBlockParam[] {
  return [cachedTextBlock(SYSTEM_PROMPT, '5m')]
}

/** Espone il testo del system prompt per memorizzarlo nella campagna (audit). */
export function getSystemPromptText(): string {
  return SYSTEM_PROMPT
}

interface BuildUserMessageOpts {
  client: AudienceMember
  fabric: FabricInfo | null
  occasion: NewsletterOccasion
  campaignTitle: string
}

/**
 * Costruisce il messaggio user per un singolo cliente.
 *
 * Limita le preferences a 5 elementi per evitare prompt enormi e per evitare
 * che il modello citi più di una preferenza (la regola è ribadita nel system).
 */
export function buildUserMessage(opts: BuildUserMessageOpts): string {
  const { client, fabric, occasion, campaignTitle } = opts
  const lines: string[] = []

  lines.push('=== CAMPAGNA ===')
  lines.push(`Titolo interno (NON usarlo come oggetto): ${campaignTitle}`)
  lines.push(`Occasione: ${occasionLabel(occasion)}`)
  lines.push('')

  lines.push('=== CLIENTE ===')
  lines.push(`Nome: ${client.first_name}`)
  if (client.last_name) lines.push(`Cognome (NON usarlo nel saluto): ${client.last_name}`)
  const prefs = client.preferences.slice(0, 5)
  if (prefs.length > 0) {
    lines.push('Preferenze note (MAX 1 citabile, e solo se davvero pertinente al tessuto):')
    for (const p of prefs) lines.push(`  - ${p}`)
  } else {
    lines.push('Preferenze note: nessuna informazione disponibile. Scrivi una newsletter neutra.')
  }
  lines.push('')

  if (fabric) {
    lines.push('=== TESSUTO IN EVIDENZA ===')
    lines.push(`Nome: ${fabric.name}`)
    if (fabric.mill) lines.push(`Mulino: ${fabric.mill}`)
    if (fabric.composition) lines.push(`Composizione: ${fabric.composition}`)
    if (fabric.weight_grams) lines.push(`Peso: ${fabric.weight_grams} g/m`)
    if (fabric.color) lines.push(`Colore: ${fabric.color}`)
    if (fabric.season) lines.push(`Stagione: ${seasonLabel(fabric.season)}`)
  } else {
    lines.push('=== TESSUTO IN EVIDENZA ===')
    lines.push('Nessun tessuto specifico — racconta la novità in modo più ampio.')
  }
  lines.push('')

  lines.push('Produci ora il JSON con i 4 slot. Niente prosa fuori dal JSON.')
  return lines.join('\n')
}

function occasionLabel(o: NewsletterOccasion): string {
  switch (o) {
    case 'new_fabric':
      return 'arrivo di un nuovo tessuto in atelier'
    case 'seasonal':
      return 'cambio di stagione'
    case 'event':
      return 'evento speciale (matrimonio, festività, ricorrenza)'
    case 'custom':
      return 'comunicazione personalizzata'
  }
}

function seasonLabel(s: 'spring_summer' | 'autumn_winter' | 'all_season'): string {
  switch (s) {
    case 'spring_summer':
      return 'primavera/estate'
    case 'autumn_winter':
      return 'autunno/inverno'
    case 'all_season':
      return 'tutte le stagioni'
  }
}
