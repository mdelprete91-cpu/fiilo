import type { Personalization } from './types'

/**
 * Render HTML inline-safe per email. Niente librerie esterne (react-email,
 * mjml): solo string interpolation + HTML semplice. Le email moderne (Gmail,
 * Apple Mail, Outlook 365) supportano abbastanza CSS inline da rendere
 * presentabile un layout sobrio.
 *
 * Il body è composto da:
 *   - Header con logo sartoria (o nome se logo assente)
 *   - 3 sezioni di testo (incipit, gancio_tessuto, chiusura)
 *   - Firma (nome sartoria)
 *   - Footer con motivo della ricezione + link "annulla iscrizione"
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fiilo.it'

interface RenderEmailOpts {
  tenantName: string
  tenantLogoUrl?: string | null
  tenantBrandColor?: string | null
  personalization: Personalization
  unsubscribeToken: string
  /** Eventuale body_md (template scritto dal sarto). Se vuoto, usiamo solo personalization. */
  templateBodyMd?: string | null
  /** Bottone CTA opzionale (es. "Scopri il tessuto") */
  ctaLabel?: string | null
  ctaUrl?: string | null
}

const DEFAULT_BRAND_COLOR = '#1f1f1f'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  unsubscribeUrl: string
}

export function renderNewsletterEmail(opts: RenderEmailOpts): RenderedEmail {
  const {
    tenantName,
    tenantLogoUrl,
    tenantBrandColor,
    personalization,
    unsubscribeToken,
    templateBodyMd,
    ctaLabel,
    ctaUrl,
  } = opts
  const brandColor = tenantBrandColor && /^#[0-9A-Fa-f]{6}$/.test(tenantBrandColor)
    ? tenantBrandColor
    : DEFAULT_BRAND_COLOR

  const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
  const subject = (personalization.subject ?? '').trim() || `Un saluto da ${tenantName}`

  // Compose corpo. Se template_body_md è valorizzato, lo prepende come
  // contesto comune; sotto, le 3 sezioni personalizzate.
  const paragraphs: string[] = []
  if (templateBodyMd && templateBodyMd.trim()) {
    paragraphs.push(escapeHtml(templateBodyMd.trim()))
  }
  paragraphs.push(escapeHtml(personalization.incipit ?? ''))
  paragraphs.push(escapeHtml(personalization.gancio_tessuto ?? ''))
  paragraphs.push(escapeHtml(personalization.chiusura ?? ''))

  const bodyHtml = paragraphs
    .filter((p) => p && p.trim())
    .map((p) => `<p style="margin:0 0 16px;color:#1f1f1f;font-size:16px;line-height:1.6;">${p}</p>`)
    .join('\n')

  const headerHtml = tenantLogoUrl
    ? `<img src="${escapeAttr(tenantLogoUrl)}" alt="${escapeAttr(tenantName)}" style="max-height:48px;max-width:200px;display:block;" />`
    : `<div style="font-family:Georgia,serif;font-size:22px;color:#1f1f1f;letter-spacing:0.02em;">${escapeHtml(tenantName)}</div>`

  const text = [
    personalization.incipit,
    personalization.gancio_tessuto,
    personalization.chiusura,
    '',
    `— ${tenantName}`,
    '',
    `Non vuoi più ricevere queste email? Annulla iscrizione: ${unsubscribeUrl}`,
  ]
    .filter((s) => s != null)
    .join('\n\n')

  const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f3ef;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e2db;border-radius:8px;overflow:hidden;border-top:3px solid ${brandColor};">
          <tr>
            <td style="padding:32px 32px 16px 32px;border-bottom:1px solid #f0ece5;">
              ${headerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaLabel && ctaUrl ? `<tr>
            <td style="padding:0 32px 24px 32px;">
              <a href="${escapeAttr(ctaUrl)}" style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.02em;">
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 32px 32px 32px;">
              <p style="margin:0;color:#1f1f1f;font-size:16px;line-height:1.6;">
                — ${escapeHtml(tenantName)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#faf8f4;border-top:1px solid #f0ece5;">
              <p style="margin:0;font-size:12px;color:#7a7468;line-height:1.5;">
                Ricevi questa email perché ti sei iscritto agli aggiornamenti di ${escapeHtml(tenantName)} su filo.
                <br />
                <a href="${escapeAttr(unsubscribeUrl)}" style="color:${brandColor};text-decoration:underline;">Annulla iscrizione</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text, unsubscribeUrl }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br />')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
