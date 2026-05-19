import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'newsletter@fiilo.it'

let _resend: Resend | null = null

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(RESEND_API_KEY)
  return _resend
}

export function isResendAvailable(): boolean {
  return Boolean(RESEND_API_KEY)
}

export interface SendNewsletterEmailOpts {
  to: string
  subject: string
  html: string
  text?: string
  unsubscribeUrl: string
  /** Override mittente (es. nome sartoria). Default `RESEND_FROM_EMAIL`. */
  from?: string
  /** Display name del mittente (es. "Sartoria Rossi"). */
  fromName?: string
  /** Reply-to opzionale (es. email della sartoria). */
  replyTo?: string
}

export interface SendNewsletterEmailResult {
  id: string | null
  error: string | null
}

/**
 * Invia una newsletter via Resend.
 *
 * SAFE TO CALL: non lancia mai, ritorna `{ id, error }`.
 *
 * Header speciali:
 *   - `List-Unsubscribe: <url>` — Gmail / Apple Mail mostrano il pulsante
 *     "Annulla iscrizione" nativo.
 *   - `List-Unsubscribe-Post: List-Unsubscribe=One-Click` — RFC 8058,
 *     consente l'unsubscribe one-click senza conferma utente.
 */
export async function sendNewsletterEmail(
  opts: SendNewsletterEmailOpts,
): Promise<SendNewsletterEmailResult> {
  const client = getClient()
  if (!client) {
    return {
      id: null,
      error: 'Resend non configurato: manca RESEND_API_KEY.',
    }
  }

  const fromAddr = opts.from ?? RESEND_FROM_EMAIL
  const from = opts.fromName
    ? `${formatFromName(opts.fromName)} <${fromAddr}>`
    : fromAddr

  try {
    const { data, error } = await client.emails.send({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
      headers: {
        'List-Unsubscribe': `<${opts.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      const message =
        typeof error === 'string'
          ? error
          : (error as { message?: string }).message ?? 'Errore Resend sconosciuto'
      return { id: null, error: message }
    }

    return { id: data?.id ?? null, error: null }
  } catch (err) {
    return {
      id: null,
      error: err instanceof Error ? err.message : 'Eccezione Resend',
    }
  }
}

/**
 * Rimuove caratteri pericolosi dal display name (RFC 5322: " e \ sono special).
 * Wrappa in virgolette doppie il display name per gestire spazi.
 */
function formatFromName(name: string): string {
  const clean = name.replace(/[\\"]/g, '').trim()
  if (!clean) return ''
  // Display names con virgola, ; o : devono essere quoted
  if (/[,;:<>@()[\]]/.test(clean)) return `"${clean}"`
  return clean
}
