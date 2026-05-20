/**
 * Generazione bozza campagna da TEMPLATE (path no-AI).
 *
 * A differenza di `generateCampaignDraft` (Anthropic), qui non si chiama
 * nessun LLM: si carica un `newsletter_templates` row, si sostituiscono
 * le variabili {{...}} per ogni destinatario e si salva il risultato in
 * `newsletter_recipients`. Zero costo, latenza istantanea.
 */

import { createClient } from '@/lib/supabase/server'
import { selectAudience } from './audience'
import { renderNewsletterEmail } from './render'
import { buildTemplateVars, substituteTemplate } from './substitute'
import type { NewsletterOccasion, Personalization } from './types'

export interface GenerateFromTemplateOpts {
  tenantId: string
  title: string
  occasion: NewsletterOccasion
  templateId: string
  featuredFabricId?: string
  userId: string
  maxRecipients?: number
}

export interface GenerateFromTemplateResult {
  campaignId: string
  recipientsCount: number
}

interface TemplateRow {
  id: string
  slug: string
  subject_template: string
  incipit_template: string
  gancio_template: string
  chiusura_template: string
  cta_label: string | null
  cta_url_template: string | null
}

export async function generateCampaignDraftFromTemplate(
  opts: GenerateFromTemplateOpts,
): Promise<GenerateFromTemplateResult> {
  const supabase = await createClient()

  // 1. Carica template, audience, fabric, tenant
  // src/types/database.ts non contiene newsletter_templates: cast localizzato.
  const [tplRes, fabricRes, tenantRes] = await Promise.all([
    supabase
      .from('newsletter_templates' as never)
      .select(
        'id, slug, subject_template, incipit_template, gancio_template, chiusura_template, cta_label, cta_url_template',
      )
      .eq('id' as never, opts.templateId)
      .single<TemplateRow>(),
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
      .select('name, logo_url, brand_color, phone')
      .eq('id', opts.tenantId)
      .single(),
  ])

  if (!tplRes.data) {
    throw new Error('Template non trovato.')
  }
  const tpl = tplRes.data
  const tenant = tenantRes.data
  if (!tenant) throw new Error('Tenant non trovato.')

  const audience = await selectAudience({
    tenantId: opts.tenantId,
    channel: 'email',
    maxRecipients: opts.maxRecipients,
  })

  const fabric = fabricRes.data
    ? {
        name: fabricRes.data.name,
        mill: fabricRes.data.mill,
        season: fabricRes.data.season,
      }
    : null

  // 2. Crea campagna in DB
  const campaignInsert = {
    tenant_id: opts.tenantId,
    title: opts.title,
    occasion: opts.occasion,
    status: 'draft' as const,
    template_id: opts.templateId,
    use_ai: false,
    template_subject: tpl.subject_template,
    template_body_md: null,
    featured_fabric_id: opts.featuredFabricId ?? null,
    ai_system_prompt: null,
    ai_model: null,
    ai_cost_cents: 0,
    recipients_count: 0,
    sent_count: 0,
    created_by: opts.userId,
  }

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

  // 3. Per ogni cliente: substitute + render
  const now = new Date()
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

  for (const member of audience) {
    const vars = buildTemplateVars({
      client: { first_name: member.first_name, last_name: member.last_name ?? null },
      tenant: { name: tenant.name, phone: tenant.phone },
      fabric,
      now,
    })

    const personalization: Personalization = {
      subject: substituteTemplate(tpl.subject_template, vars),
      incipit: substituteTemplate(tpl.incipit_template, vars),
      gancio_tessuto: substituteTemplate(tpl.gancio_template, vars),
      chiusura: substituteTemplate(tpl.chiusura_template, vars),
    }

    const ctaLabel = tpl.cta_label
    const ctaUrl = tpl.cta_url_template
      ? substituteTemplate(tpl.cta_url_template, vars).trim() || null
      : null

    const rendered = renderNewsletterEmail({
      tenantName: tenant.name,
      tenantLogoUrl: tenant.logo_url,
      tenantBrandColor: tenant.brand_color,
      personalization,
      unsubscribeToken: member.unsubscribe_token,
      templateBodyMd: null,
      ctaLabel,
      ctaUrl: ctaUrl && ctaUrl !== '' ? ctaUrl : null,
    })

    recipientRows.push({
      campaign_id: campaignId,
      client_id: member.client_id,
      tenant_id: opts.tenantId,
      channel: 'email',
      rendered_subject: rendered.subject,
      rendered_body: rendered.html,
      personalization_json: personalization,
      status: 'pending',
    })
  }

  // 4. Bulk insert recipients
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

  // 5. Update count
  await (
    supabase.from('newsletter_campaigns') as unknown as {
      update: (v: { recipients_count: number }) => {
        eq: (k: string, v: unknown) => Promise<{ error: unknown }>
      }
    }
  )
    .update({ recipients_count: recipientRows.length })
    .eq('id', campaignId)

  return {
    campaignId,
    recipientsCount: recipientRows.length,
  }
}
