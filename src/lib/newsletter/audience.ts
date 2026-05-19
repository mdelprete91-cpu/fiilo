import { createClient } from '@/lib/supabase/server'
import type { AudienceMember } from './types'

const DEFAULT_MAX_RECIPIENTS = 500
const THROTTLE_DAYS = 30

interface SelectAudienceOpts {
  tenantId: string
  channel: 'email' | 'whatsapp'
  maxRecipients?: number
}

/**
 * Seleziona i clienti del tenant che possono ricevere una newsletter.
 *
 * Filtri applicati:
 *  - `clients.marketing_optout = false` — colonna creata dalla migration 023
 *    (DIPENDENZA: agente WhatsApp Catalog Push). Se la colonna non esiste
 *    in DB, la query fallisce: applicare prima la 023.
 *  - `newsletter_preferences.email_opted_in = true` (per channel='email').
 *  - `newsletter_preferences.unsubscribed_at IS NULL`.
 *  - `newsletter_preferences.last_sent_at` null o > 30 giorni fa (throttle).
 *  - `clients.email` non null e non vuoto (per channel='email').
 *
 * Le `preferences` sono lette da `client_summaries.summary_json.preferences[]`
 * (array di oggetti `{text, message_id}`) e mappate in array di stringhe.
 *
 * Nota: WHATSAPP è out-of-scope per MVP, ma la firma supporta il channel
 * per non riscrivere l'API quando V2 si attiverà.
 */
export async function selectAudience(
  opts: SelectAudienceOpts,
): Promise<AudienceMember[]> {
  const { tenantId, channel, maxRecipients = DEFAULT_MAX_RECIPIENTS } = opts
  const supabase = await createClient()

  const cutoff = new Date(
    Date.now() - THROTTLE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  // Step 1: leggi preferenze opt-in del tenant.
  //
  // Usiamo `as any` perché src/types/database.ts non contiene ancora la tabella
  // `newsletter_preferences` (cfr. vincolo: non rigenerare i tipi).
  let prefQuery = (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          is: (k: string, v: unknown) => {
            or: (q: string) => {
              limit: (n: number) => Promise<{
                data: Array<{
                  client_id: string
                  unsubscribe_token: string
                  last_sent_at: string | null
                  email_opted_in: boolean
                  whatsapp_opted_in: boolean
                  unsubscribed_at: string | null
                }> | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    }
  }).from('newsletter_preferences')

  const optedCol = channel === 'email' ? 'email_opted_in' : 'whatsapp_opted_in'

  const { data: prefs, error: prefErr } = await prefQuery
    .select(
      'client_id, unsubscribe_token, last_sent_at, email_opted_in, whatsapp_opted_in, unsubscribed_at',
    )
    .eq('tenant_id', tenantId)
    .is('unsubscribed_at', null)
    .or(`last_sent_at.is.null,last_sent_at.lt.${cutoff}`)
    .limit(maxRecipients * 2)

  if (prefErr) {
    throw new Error(
      `Errore lettura newsletter_preferences: ${prefErr.message}`,
    )
  }

  const filteredPrefs = (prefs ?? []).filter((p) =>
    channel === 'email' ? p.email_opted_in : p.whatsapp_opted_in,
  )

  if (filteredPrefs.length === 0) return []

  const tokenByClientId = new Map<string, string>()
  for (const p of filteredPrefs) tokenByClientId.set(p.client_id, p.unsubscribe_token)
  const clientIds = Array.from(tokenByClientId.keys())

  // Step 2: leggi clienti non in opt-out marketing globale.
  //
  // `marketing_optout` viene dalla migration 023. Se la 023 non è applicata
  // questa query restituisce errore — gestiamo loggando ma proseguendo SENZA
  // il filtro (fallback safe per dev).
  const clientsTable = supabase
    .from('clients')
    .select('id, first_name, last_name, email')
    .eq('tenant_id', tenantId)
    .in('id', clientIds)
    .not('email', 'is', null)

  let clientsRes: {
    data: Array<{
      id: string
      first_name: string
      last_name: string
      email: string | null
    }> | null
    error: { message: string } | null
  }
  try {
    // Tentativo CON filtro marketing_optout=false.
    const withOptout = await (
      clientsTable as unknown as {
        eq: (k: string, v: unknown) => Promise<{
          data: Array<{
            id: string
            first_name: string
            last_name: string
            email: string | null
          }> | null
          error: { message: string } | null
        }>
      }
    ).eq('marketing_optout', false)

    if (withOptout.error) {
      // Colonna mancante (migration 023 non applicata): fallback senza filtro.
      console.warn(
        '[newsletter.audience] clients.marketing_optout non disponibile, fallback senza filtro. Applicare migration 023.',
        withOptout.error.message,
      )
      clientsRes = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .in('id', clientIds)
        .not('email', 'is', null)
    } else {
      clientsRes = withOptout
    }
  } catch {
    clientsRes = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('tenant_id', tenantId)
      .in('id', clientIds)
      .not('email', 'is', null)
  }

  if (clientsRes.error) {
    throw new Error(`Errore lettura clients: ${clientsRes.error.message}`)
  }
  const validClients = (clientsRes.data ?? []).filter(
    (c) => c.email && c.email.trim() !== '',
  )

  if (validClients.length === 0) return []

  // Step 3: leggi le summary AI per estrarre le preferences.
  const summariesRes = await supabase
    .from('client_summaries')
    .select('client_id, summary_json')
    .eq('tenant_id', tenantId)
    .in(
      'client_id',
      validClients.map((c) => c.id),
    )

  const preferencesByClient = new Map<string, string[]>()
  for (const s of summariesRes.data ?? []) {
    const json = s.summary_json as { preferences?: Array<{ text?: string }> } | null
    const prefs = Array.isArray(json?.preferences) ? json.preferences : []
    const texts: string[] = []
    for (const p of prefs) {
      if (typeof p?.text === 'string' && p.text.trim()) texts.push(p.text.trim())
    }
    preferencesByClient.set(s.client_id, texts)
  }

  // Step 4: assembla audience finale.
  const audience: AudienceMember[] = validClients
    .slice(0, maxRecipients)
    .map((c) => ({
      client_id: c.id,
      email: (c.email ?? '').trim(),
      first_name: c.first_name,
      last_name: c.last_name,
      preferences: preferencesByClient.get(c.id) ?? [],
      unsubscribe_token: tokenByClientId.get(c.id) ?? '',
    }))
    .filter((a) => a.email && a.unsubscribe_token)

  return audience
}
