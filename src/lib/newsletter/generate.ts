import { z } from 'zod'
import {
  createMessage,
  DEFAULT_MODEL,
  extractText,
  isAvailable,
} from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { selectAudience } from './audience'
import {
  buildSystemBlocks,
  buildUserMessage,
  getSystemPromptText,
} from './prompt'
import { renderNewsletterEmail } from './render'
import type {
  AudienceMember,
  FabricInfo,
  NewsletterOccasion,
  Personalization,
} from './types'

// ─── Schema validazione output AI ─────────────────────────────

const PersonalizationSchema = z.object({
  subject: z.string().min(3).max(120),
  incipit: z.string().min(10).max(800),
  gancio_tessuto: z.string().min(10).max(1200),
  chiusura: z.string().min(5).max(600),
})

// ─── Pricing Haiku 4.5 (USD per million tokens) ───────────────
const PRICE_IN_PER_MTOK_USD = 1
const PRICE_OUT_PER_MTOK_USD = 5

function costInCents(tokensIn: number, tokensOut: number): number {
  const inUsd = (tokensIn / 1_000_000) * PRICE_IN_PER_MTOK_USD
  const outUsd = (tokensOut / 1_000_000) * PRICE_OUT_PER_MTOK_USD
  return Number(((inUsd + outUsd) * 100).toFixed(4))
}

// ─── Main entry ───────────────────────────────────────────────

export interface GenerateCampaignDraftOpts {
  tenantId: string
  title: string
  occasion: NewsletterOccasion
  featuredFabricId?: string
  userId: string
  /** Limite recipients (default 500). */
  maxRecipients?: number
}

export interface GenerateCampaignDraftResult {
  campaignId: string
  recipientsCount: number
  totalCostCents: number
}

/**
 * Genera una bozza di campagna:
 *   1. carica audience
 *   2. carica tessuto in evidenza (se fornito)
 *   3. crea row campagna con status='draft'
 *   4. per ogni cliente: 1 chiamata Haiku 4.5 con system cached
 *   5. salva newsletter_recipients con copy renderizzata
 *   6. aggiorna `recipients_count`, `ai_cost_cents` sulla campagna
 *
 * Non invia nulla: l'invio è separato (`approveAndSendAction`).
 */
export async function generateCampaignDraft(
  opts: GenerateCampaignDraftOpts,
): Promise<GenerateCampaignDraftResult> {
  if (!isAvailable()) {
    throw new Error(
      'Anthropic API non configurato (manca ANTHROPIC_API_KEY).',
    )
  }

  const supabase = await createClient()

  // 1. Audience
  const audience = await selectAudience({
    tenantId: opts.tenantId,
    channel: 'email',
    maxRecipients: opts.maxRecipients,
  })

  // 2. Tessuto evidenza + dati tenant
  const [fabricRes, tenantRes] = await Promise.all([
    opts.featuredFabricId
      ? supabase
          .from('fabrics')
          .select('id, name, mill, composition, weight_grams, color, season')
          .eq('id', opts.featuredFabricId)
          .eq('tenant_id', opts.tenantId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('tenants')
      .select('name, logo_url, brand_color, email')
      .eq('id', opts.tenantId)
      .single(),
  ])

  const fabric: FabricInfo | null = fabricRes.data
    ? {
        id: fabricRes.data.id,
        name: fabricRes.data.name,
        mill: fabricRes.data.mill,
        composition: fabricRes.data.composition,
        weight_grams: fabricRes.data.weight_grams,
        color: fabricRes.data.color,
        season: fabricRes.data.season,
      }
    : null

  const tenantName = tenantRes.data?.name ?? 'la tua sartoria'
  const tenantLogoUrl = tenantRes.data?.logo_url ?? null
  const tenantBrandColor = tenantRes.data?.brand_color ?? null

  // 3. Crea campagna in DB
  const systemPromptText = getSystemPromptText()
  const campaignInsert = {
    tenant_id: opts.tenantId,
    title: opts.title,
    occasion: opts.occasion,
    status: 'draft' as const,
    template_subject: null,
    template_body_md: null,
    featured_fabric_id: opts.featuredFabricId ?? null,
    ai_system_prompt: systemPromptText,
    ai_model: DEFAULT_MODEL,
    ai_cost_cents: 0,
    recipients_count: 0,
    sent_count: 0,
    created_by: opts.userId,
  }

  // src/types/database.ts non contiene le tabelle nuove: cast esplicito.
  const insertRes = await (
    supabase.from('newsletter_campaigns') as unknown as {
      insert: (v: typeof campaignInsert) => {
        select: (q: string) => {
          single: () => Promise<{
            data: { id: string } | null
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .insert(campaignInsert)
    .select('id')
    .single()

  if (insertRes.error || !insertRes.data) {
    throw new Error(
      `Errore creazione campagna: ${insertRes.error?.message ?? 'unknown'}`,
    )
  }
  const campaignId = insertRes.data.id

  // 4. Per ogni cliente: chiamata LLM
  let totalTokensIn = 0
  let totalTokensOut = 0
  const systemBlocks = buildSystemBlocks()
  const recipientRows: Array<{
    campaign_id: string
    client_id: string
    tenant_id: string
    channel: 'email'
    rendered_subject: string
    rendered_body: string
    personalization_json: Personalization
    status: 'pending'
  }> = []

  // Sequenziale: il prompt cached funziona meglio in chiamate ravvicinate
  // sullo stesso modello. Anche per debug/tracciamento costi è più semplice.
  for (const member of audience) {
    const personalization = await generateForClient({
      client: member,
      fabric,
      occasion: opts.occasion,
      campaignTitle: opts.title,
      userId: opts.userId,
      systemBlocks,
    })
    if (!personalization) continue

    totalTokensIn += personalization._usage.tokensIn
    totalTokensOut += personalization._usage.tokensOut

    const rendered = renderNewsletterEmail({
      tenantName,
      tenantLogoUrl,
      tenantBrandColor,
      personalization: personalization.data,
      unsubscribeToken: member.unsubscribe_token,
      templateBodyMd: null,
    })

    recipientRows.push({
      campaign_id: campaignId,
      client_id: member.client_id,
      tenant_id: opts.tenantId,
      channel: 'email',
      rendered_subject: rendered.subject,
      rendered_body: rendered.html,
      personalization_json: personalization.data,
      status: 'pending',
    })
  }

  // 5. Bulk insert recipients
  if (recipientRows.length > 0) {
    const recRes = await (
      supabase.from('newsletter_recipients') as unknown as {
        insert: (v: typeof recipientRows) => Promise<{
          error: { message: string } | null
        }>
      }
    ).insert(recipientRows)
    if (recRes.error) {
      throw new Error(
        `Errore insert recipients: ${recRes.error.message}`,
      )
    }
  }

  const totalCostCents = costInCents(totalTokensIn, totalTokensOut)

  // 6. Update campaign con conteggi e costi
  await (
    supabase.from('newsletter_campaigns') as unknown as {
      update: (v: {
        recipients_count: number
        ai_cost_cents: number
      }) => {
        eq: (k: string, v: unknown) => Promise<{ error: unknown }>
      }
    }
  )
    .update({
      recipients_count: recipientRows.length,
      ai_cost_cents: totalCostCents,
    })
    .eq('id', campaignId)

  return {
    campaignId,
    recipientsCount: recipientRows.length,
    totalCostCents,
  }
}

// ─── Helper: 1 client → 1 chiamata LLM ────────────────────────

interface GenerateForClientResult {
  data: Personalization
  _usage: { tokensIn: number; tokensOut: number }
}

async function generateForClient(opts: {
  client: AudienceMember
  fabric: FabricInfo | null
  occasion: NewsletterOccasion
  campaignTitle: string
  userId: string
  systemBlocks: ReturnType<typeof buildSystemBlocks>
}): Promise<GenerateForClientResult | null> {
  const userMsg = buildUserMessage({
    client: opts.client,
    fabric: opts.fabric,
    occasion: opts.occasion,
    campaignTitle: opts.campaignTitle,
  })

  const response = await createMessage({
    system: opts.systemBlocks,
    messages: [{ role: 'user', content: userMsg }],
    max_tokens: 700,
    model: DEFAULT_MODEL,
    user_id: opts.userId,
  })

  if (!response) {
    console.error(
      '[newsletter.generate] LLM call failed for client',
      opts.client.client_id,
    )
    return null
  }

  const raw = extractText(response)
  const parsed = tryParse(raw)
  if (!parsed) {
    console.warn(
      '[newsletter.generate] AI output non valido per client',
      opts.client.client_id,
      raw.slice(0, 200),
    )
    return null
  }

  const tokensIn =
    response.usage.input_tokens +
    (response.usage.cache_creation_input_tokens ?? 0) +
    (response.usage.cache_read_input_tokens ?? 0)
  const tokensOut = response.usage.output_tokens

  return {
    data: parsed,
    _usage: { tokensIn, tokensOut },
  }
}

function tryParse(text: string): Personalization | null {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()
  }
  try {
    const parsed = JSON.parse(cleaned)
    const result = PersonalizationSchema.safeParse(parsed)
    if (!result.success) {
      console.warn(
        '[newsletter.generate] Zod fail:',
        result.error.issues.slice(0, 3),
      )
      return null
    }
    return result.data
  } catch (err) {
    console.warn(
      '[newsletter.generate] JSON parse fail:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}
