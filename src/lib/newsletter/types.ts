/**
 * Tipi locali per il modulo newsletter.
 *
 * NOTE: `src/types/database.ts` non è stato rigenerato dopo la migration 022,
 * quindi i tipi delle tabelle `newsletter_*` non sono presenti in `Database`.
 * Definiamo qui forme essenziali per il consumo applicativo. Le query verso
 * Supabase usano `from('newsletter_*')` con cast `as never` o `as any` quando
 * il typecheck del client supabase fallisce.
 */

export type NewsletterStatus =
  | 'draft'
  | 'approved'
  | 'sending'
  | 'sent'
  | 'cancelled'

export type NewsletterOccasion =
  | 'new_fabric'
  | 'seasonal'
  | 'event'
  | 'custom'

export type RecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'unsubscribed'

export interface NewsletterCampaignRow {
  id: string
  tenant_id: string
  title: string
  occasion: NewsletterOccasion
  status: NewsletterStatus
  template_subject: string | null
  template_body_md: string | null
  featured_fabric_id: string | null
  ai_system_prompt: string | null
  ai_model: string | null
  ai_cost_cents: number
  recipients_count: number
  sent_count: number
  scheduled_at: string | null
  sent_at: string | null
  created_by: string | null
  created_at: string
}

export interface NewsletterRecipientRow {
  id: string
  campaign_id: string
  client_id: string
  tenant_id: string
  channel: 'email' | 'whatsapp'
  rendered_subject: string | null
  rendered_body: string | null
  personalization_json: Personalization | null
  status: RecipientStatus
  sent_at: string | null
  error_message: string | null
  resend_message_id: string | null
  wa_message_id: string | null
}

export interface NewsletterPreferenceRow {
  client_id: string
  tenant_id: string
  email_opted_in: boolean
  whatsapp_opted_in: boolean
  unsubscribe_token: string
  last_sent_at: string | null
  unsubscribed_at: string | null
  created_at: string
}

/** Forma del JSON personalizzato prodotto dall'LLM. */
export interface Personalization {
  subject: string
  incipit: string
  gancio_tessuto: string
  chiusura: string
}

/** Riga del catalogo tessuti, restretta ai campi utili al modulo newsletter. */
export interface FabricInfo {
  id: string
  name: string
  mill: string | null
  composition: string | null
  weight_grams: number | null
  color: string | null
  season: 'spring_summer' | 'autumn_winter' | 'all_season' | null
}

/** Cliente nell'audience della campagna. */
export interface AudienceMember {
  client_id: string
  email: string
  first_name: string
  last_name: string
  preferences: string[]
  unsubscribe_token: string
}
