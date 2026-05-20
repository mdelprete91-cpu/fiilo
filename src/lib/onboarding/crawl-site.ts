/**
 * Crawler leggero per il sito vetrina di una sartoria.
 * Usa fetch + cheerio (no headless browser). I siti che richiedono JS
 * rendering completo non saranno estratti perfettamente — il sarto può
 * fare override manuale.
 */

import * as cheerio from 'cheerio'

const USER_AGENT = 'filoBot/1.0 (+https://fiilo.it)'
const FETCH_TIMEOUT_MS = 10_000
const MAX_HTML_BYTES = 1_500_000 // 1.5 MB

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8' },
      signal: controller.signal,
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timer)
  }
}

export interface HomepageFetch {
  html: string
  finalUrl: string
  contentType: string
}

export async function fetchHomepage(url: string): Promise<HomepageFetch | null> {
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_HTML_BYTES) return null
    const html = new TextDecoder().decode(buf)
    return { html, finalUrl: res.url, contentType }
  } catch {
    return null
  }
}

export interface ExtractedMeta {
  ogImage: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogSiteName: string | null
  twitterImage: string | null
  favicon: string | null
  themeColor: string | null
  language: string | null
  candidateLogos: string[]
  candidateColors: string[]
  homepageText: string
}

function absoluteUrl(href: string | undefined, baseUrl: string): string | null {
  if (!href) return null
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

export function extractMetaFromHtml(html: string, baseUrl: string): ExtractedMeta {
  const $ = cheerio.load(html)
  const get = (sel: string, attr = 'content'): string | null =>
    $(sel).first().attr(attr)?.trim() || null

  const ogImage = absoluteUrl(get('meta[property="og:image"]') ?? undefined, baseUrl)
  const twitterImage = absoluteUrl(get('meta[name="twitter:image"]') ?? undefined, baseUrl)
  const favicon =
    absoluteUrl(
      $('link[rel="apple-touch-icon"]').first().attr('href') ??
        $('link[rel="icon"]').first().attr('href') ??
        '/favicon.ico',
      baseUrl,
    ) ?? null

  const candidateLogos: string[] = []
  $('img').each((_, el) => {
    const src = $(el).attr('src')
    const cls = $(el).attr('class') ?? ''
    const id = $(el).attr('id') ?? ''
    const alt = $(el).attr('alt') ?? ''
    if (src && /logo|brand|marchio/i.test(`${cls} ${id} ${alt}`)) {
      const abs = absoluteUrl(src, baseUrl)
      if (abs && !candidateLogos.includes(abs)) candidateLogos.push(abs)
    }
  })

  const candidateColors = new Set<string>()
  const themeColor = get('meta[name="theme-color"]')
  if (themeColor && /^#?[0-9a-fA-F]{6}$/.test(themeColor)) {
    candidateColors.add(themeColor.startsWith('#') ? themeColor : `#${themeColor}`)
  }
  // Estrazione hex colors dai <style> inline e attributi style
  const styleText =
    ($('style').text() || '') + ' ' + ($('[style]').map((_, el) => $(el).attr('style') ?? '').get().join(' '))
  const hexMatches = styleText.match(/#[0-9a-fA-F]{6}\b/g) ?? []
  for (const c of hexMatches.slice(0, 50)) {
    candidateColors.add(c.toUpperCase())
  }

  // Estrai testo significativo della homepage (no script/style, top 2000 char)
  $('script, style, noscript').remove()
  const homepageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000)

  return {
    ogImage,
    ogTitle: get('meta[property="og:title"]') ?? ($('title').first().text().trim() || null),
    ogDescription: get('meta[property="og:description"]') ?? get('meta[name="description"]'),
    ogSiteName: get('meta[property="og:site_name"]'),
    twitterImage,
    favicon,
    themeColor,
    language: $('html').attr('lang') ?? null,
    candidateLogos: candidateLogos.slice(0, 6),
    candidateColors: Array.from(candidateColors).slice(0, 20),
    homepageText,
  }
}

export async function findCatalogUrls(
  baseUrl: string,
  maxUrls = 20,
): Promise<string[]> {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml']
  const collected: string[] = []
  for (const path of candidates) {
    const sitemapUrl = absoluteUrl(path, baseUrl)
    if (!sitemapUrl) continue
    try {
      const res = await fetchWithTimeout(sitemapUrl)
      if (!res.ok) continue
      const text = await res.text()
      const matches = text.match(/<loc>([^<]+)<\/loc>/gi) ?? []
      for (const m of matches) {
        const url = m.replace(/<\/?loc>/gi, '').trim()
        if (
          /\/(brand|tessut|abit|product|catalog|shop|collezion|prodott)/i.test(url) &&
          !collected.includes(url)
        ) {
          collected.push(url)
          if (collected.length >= maxUrls) return collected
        }
      }
      if (collected.length > 0) break
    } catch {
      // try next
    }
  }
  return collected
}

export interface CatalogPagePreview {
  url: string
  title: string | null
  image_url: string | null
  description: string | null
}

export async function fetchCatalogPage(url: string): Promise<CatalogPagePreview | null> {
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) return null
    const html = await res.text()
    const meta = extractMetaFromHtml(html, url)
    return {
      url,
      title: meta.ogTitle,
      image_url: meta.ogImage ?? meta.twitterImage,
      description: meta.ogDescription,
    }
  } catch {
    return null
  }
}
