'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import {
  fetchHomepage,
  extractMetaFromHtml,
  findCatalogUrls,
  fetchCatalogPage,
  type CatalogPagePreview,
} from '@/lib/onboarding/crawl-site'
import { analyzeBrandWithAI, type BrandAnalysis } from '@/lib/onboarding/analyze-with-ai'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface ImportPreview {
  websiteUrl: string
  analysis: BrandAnalysis
  catalogItems: CatalogPagePreview[]
}

const ImportInputSchema = z.object({
  website_url: z.string().min(4),
})

function normalizeUrl(raw: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const u = new URL(withScheme)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u.origin
  } catch {
    return null
  }
}

/**
 * Esegue analisi sito + applicazione automatica per un tenant.
 * Versione interna riusabile (NESSUNA verifica di ruolo). Da chiamare
 * SOLO da server actions che hanno già verificato l'autorizzazione del caller
 * (es. `createTenantAction` platform_owner, o `importFromSiteUrlAction` tenant_admin).
 *
 * Fail-soft: ritorna sempre, anche su errori. Non lancia eccezioni.
 */
export async function runSiteImportForTenant(opts: {
  tenantId: string
  websiteUrl: string
  /** Se true, applica logo e colore solo se mancanti sul tenant. Default true. */
  preserveExisting?: boolean
}): Promise<{ applied: boolean; logoApplied: boolean; colorApplied: boolean; catalogCount: number; error?: string }> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const preserveExisting = opts.preserveExisting ?? true

    const normalized = normalizeUrl(opts.websiteUrl)
    if (!normalized) return { applied: false, logoApplied: false, colorApplied: false, catalogCount: 0, error: 'URL non valido' }

    const home = await fetchHomepage(normalized)
    if (!home) return { applied: false, logoApplied: false, colorApplied: false, catalogCount: 0, error: 'Sito non raggiungibile' }

    const meta = extractMetaFromHtml(home.html, home.finalUrl)
    const analysis = await analyzeBrandWithAI({ websiteUrl: home.finalUrl, meta })
    if (!analysis) return { applied: false, logoApplied: false, colorApplied: false, catalogCount: 0, error: 'Analisi AI fallita' }

    // Read existing tenant state to decide what to overwrite
    let existingLogo: string | null = null
    let existingColor: string | null = null
    if (preserveExisting) {
      const { data: t } = await supabase
        .from('tenants')
        .select('logo_url, brand_color')
        .eq('id', opts.tenantId)
        .single()
      existingLogo = t?.logo_url ?? null
      existingColor = t?.brand_color ?? null
    }

    const tenantUpdate: Record<string, unknown> = { website_url: home.finalUrl }
    let logoApplied = false
    let colorApplied = false
    if (analysis.logo_url && !existingLogo) {
      tenantUpdate.logo_url = analysis.logo_url
      logoApplied = true
    }
    if (analysis.brand_color_hex && !existingColor) {
      tenantUpdate.brand_color = analysis.brand_color_hex
      colorApplied = true
    }
    await supabase.from('tenants').update(tenantUpdate as never).eq('id', opts.tenantId)

    // Catalog discovery (best-effort)
    const catalogUrls = await findCatalogUrls(home.finalUrl, 10)
    const catalogResults = await Promise.allSettled(catalogUrls.map((u) => fetchCatalogPage(u)))
    const catalogItems = catalogResults
      .filter((r): r is PromiseFulfilledResult<CatalogPagePreview> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)

    if (catalogItems.length > 0) {
      const rows = catalogItems.map((c) => ({
        tenant_id: opts.tenantId,
        url: c.url,
        title: c.title,
        image_url: c.image_url,
        description: c.description,
        detected_kind: 'unknown',
        last_seen_at: new Date().toISOString(),
      }))
      await (
        supabase.from('tenant_external_catalog' as never) as unknown as {
          upsert: (v: typeof rows, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>
        }
      ).upsert(rows, { onConflict: 'tenant_id,url' })
    }

    return {
      applied: true,
      logoApplied,
      colorApplied,
      catalogCount: catalogItems.length,
    }
  } catch (e) {
    return {
      applied: false,
      logoApplied: false,
      colorApplied: false,
      catalogCount: 0,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}

export async function importFromSiteUrlAction(
  formData: FormData,
): Promise<ActionResult<ImportPreview>> {
  try {
    await requireRole(['tenant_admin'])
    const parsed = ImportInputSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { success: false, error: 'URL mancante.' }

    const normalized = normalizeUrl(parsed.data.website_url.trim())
    if (!normalized) return { success: false, error: 'URL non valido.' }

    const home = await fetchHomepage(normalized)
    if (!home) {
      return {
        success: false,
        error: 'Impossibile leggere il sito. Verifica che sia pubblico e raggiungibile.',
      }
    }

    const meta = extractMetaFromHtml(home.html, home.finalUrl)

    const analysis = await analyzeBrandWithAI({
      websiteUrl: home.finalUrl,
      meta,
    })
    if (!analysis) {
      return {
        success: false,
        error:
          "L'analisi automatica non è riuscita. Puoi inserire logo e colore manualmente nella sezione Brand sartoria.",
      }
    }

    const catalogUrls = await findCatalogUrls(home.finalUrl, 10)
    const catalogResults = await Promise.allSettled(
      catalogUrls.map((u) => fetchCatalogPage(u)),
    )
    const catalogItems = catalogResults
      .filter(
        (r): r is PromiseFulfilledResult<CatalogPagePreview> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value)

    return {
      success: true,
      data: {
        websiteUrl: home.finalUrl,
        analysis,
        catalogItems,
      },
    }
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto durante l\'analisi.',
    }
  }
}

interface ApplyInput {
  websiteUrl: string
  logoUrl: string | null
  brandColor: string | null
  officialName: string | null
  catalogItems: CatalogPagePreview[]
}

export async function applyImportPreviewAction(
  input: ApplyInput,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin'])
    const tid = session.tenantId!
    const supabase = await createClient()

    const tenantUpdate: Record<string, unknown> = { website_url: input.websiteUrl }
    if (input.logoUrl) tenantUpdate.logo_url = input.logoUrl
    if (input.brandColor) tenantUpdate.brand_color = input.brandColor
    if (input.officialName) tenantUpdate.name = input.officialName

    const { error: tenantErr } = await supabase
      .from('tenants')
      .update(tenantUpdate as never)
      .eq('id', tid)
    if (tenantErr) return { success: false, error: tenantErr.message }

    if (input.catalogItems.length > 0) {
      const rows = input.catalogItems.map((c) => ({
        tenant_id: tid,
        url: c.url,
        title: c.title,
        image_url: c.image_url,
        description: c.description,
        detected_kind: 'unknown',
        last_seen_at: new Date().toISOString(),
      }))
      const upsertRes = await (
        supabase.from('tenant_external_catalog' as never) as unknown as {
          upsert: (
            v: typeof rows,
            opts: { onConflict: string },
          ) => Promise<{ error: { message: string } | null }>
        }
      ).upsert(rows, { onConflict: 'tenant_id,url' })
      if (upsertRes.error) {
        return { success: false, error: upsertRes.error.message }
      }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}
