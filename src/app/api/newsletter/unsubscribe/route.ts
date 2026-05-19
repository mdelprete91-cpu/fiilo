import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Endpoint pubblico per l'unsubscribe one-click (RFC 8058 + List-Unsubscribe).
 *
 * Accetta sia GET (link cliccato in email) sia POST (one-click from Gmail UI).
 *
 * Usa il service-role client perché:
 *   - l'utente NON è autenticato
 *   - il token nell'URL è la sola credenziale
 *   - non possiamo dipendere da RLS my_tenant_id()
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleUnsubscribe(request)
}

export async function POST(request: NextRequest) {
  return handleUnsubscribe(request)
}

async function handleUnsubscribe(request: NextRequest): Promise<Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim()

  if (!token || !/^[a-f0-9]{32,128}$/i.test(token)) {
    return htmlResponse(renderErrorPage('Token mancante o non valido.'), 400)
  }

  let supabase
  try {
    supabase = await createServiceClient()
  } catch {
    return htmlResponse(
      renderErrorPage('Servizio temporaneamente non disponibile.'),
      500,
    )
  }

  // Lookup + update in una sola operazione
  const updateRes = await (
    supabase.from('newsletter_preferences') as unknown as {
      update: (v: {
        unsubscribed_at: string
        email_opted_in: boolean
        whatsapp_opted_in: boolean
      }) => {
        eq: (k: string, v: unknown) => {
          select: (q: string) => Promise<{
            data: Array<{ client_id: string }> | null
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .update({
      unsubscribed_at: new Date().toISOString(),
      email_opted_in: false,
      whatsapp_opted_in: false,
    })
    .eq('unsubscribe_token', token)
    .select('client_id')

  if (updateRes.error) {
    return htmlResponse(
      renderErrorPage('Errore nel processare la richiesta.'),
      500,
    )
  }

  if (!updateRes.data || updateRes.data.length === 0) {
    return htmlResponse(
      renderErrorPage(
        'Iscrizione non trovata. Forse hai già annullato l\'iscrizione.',
      ),
      404,
    )
  }

  return htmlResponse(renderSuccessPage(), 200)
}

// ─── HTML helpers ─────────────────────────────────────────────

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function renderSuccessPage(): string {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Iscrizione rimossa</title>
<style>
  body { margin:0; padding:0; background:#f5f3ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f1f1f; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 80px 24px; text-align: center; }
  .card { background:#fff; border:1px solid #e6e2db; border-radius:8px; padding:32px; }
  h1 { font-family: Georgia, serif; font-size: 28px; font-weight: normal; margin: 0 0 12px; letter-spacing:0.01em; }
  p { font-size: 15px; line-height: 1.6; color: #4a4538; margin: 0 0 8px; }
  .ok { font-size: 32px; line-height: 1; margin-bottom: 16px; color: #5a8a4a; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="ok">✓</div>
      <h1>Iscrizione rimossa</h1>
      <p>Non riceverai più newsletter da questo mittente.</p>
      <p style="margin-top:20px;color:#7a7468;font-size:13px;">Grazie per averci letti fino a qui.</p>
    </div>
  </div>
</body>
</html>`
}

function renderErrorPage(msg: string): string {
  const safe = msg
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Errore</title>
<style>
  body { margin:0; padding:0; background:#f5f3ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f1f1f; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 80px 24px; text-align: center; }
  .card { background:#fff; border:1px solid #e6e2db; border-radius:8px; padding:32px; }
  h1 { font-family: Georgia, serif; font-size: 24px; font-weight: normal; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; color: #4a4538; margin: 0; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Non è stato possibile completare l'operazione</h1>
      <p>${safe}</p>
    </div>
  </div>
</body>
</html>`
}
