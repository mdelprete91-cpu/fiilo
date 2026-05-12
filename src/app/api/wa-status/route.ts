import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/wa-status
 *
 * Verifica che WHATSAPP_CLOUD_API_TOKEN sia ancora valido pingando Meta Graph
 * API. Risponde JSON con esito + errore se il token è scaduto/invalido.
 *
 * Da consultare dopo "media_url is null" persistenti: il sospetto è che il
 * token Meta sia scaduto (i system user access token sono permanenti, ma i
 * test token durano 24h).
 *
 * Sicuro da esporre: niente leak del token, solo presenza/validità/scope.
 */
export async function GET() {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  const appSecret = process.env.META_APP_SECRET

  const envs = {
    WHATSAPP_CLOUD_API_TOKEN: Boolean(token),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(phoneNumberId),
    WHATSAPP_VERIFY_TOKEN: Boolean(verifyToken),
    META_APP_SECRET: Boolean(appSecret),
  }

  if (!token) {
    return NextResponse.json({
      envs,
      meta_ping: { ok: false, error: 'WHATSAPP_CLOUD_API_TOKEN not set' },
    })
  }

  // Test 1: ping `me` endpoint con il token. Risponde 200 + info app se valido.
  let meOk = false
  let meError: string | null = null
  let meInfo: Record<string, unknown> | null = null
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      meOk = true
      meInfo = (await res.json()) as Record<string, unknown>
    } else {
      const body = await res.text().catch(() => '')
      meError = `HTTP ${res.status}: ${body.slice(0, 200)}`
    }
  } catch (err) {
    meError = err instanceof Error ? err.message : String(err)
  }

  // Test 2: prova ad accedere al phone_number_id (verifica scope)
  let phoneOk = false
  let phoneError: string | null = null
  if (phoneNumberId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.ok) {
        phoneOk = true
      } else {
        const body = await res.text().catch(() => '')
        phoneError = `HTTP ${res.status}: ${body.slice(0, 200)}`
      }
    } catch (err) {
      phoneError = err instanceof Error ? err.message : String(err)
    }
  } else {
    phoneError = 'WHATSAPP_PHONE_NUMBER_ID not set'
  }

  return NextResponse.json({
    envs,
    meta_me_ping: { ok: meOk, error: meError, info: meInfo },
    phone_number_ping: { ok: phoneOk, error: phoneError },
    diagnosis:
      !meOk && meError?.includes('expired')
        ? 'TOKEN SCADUTO: crea un System User Access Token permanente in Meta Business Suite'
        : !meOk
          ? `Token rifiutato da Meta: ${meError}`
          : !phoneOk
            ? `Token valido ma niente accesso al phone_number_id: ${phoneError}`
            : 'Token e accesso phone_number_id OK. Il media download dovrebbe funzionare.',
  })
}
