import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import {
  buildAppAccessToken,
  debugToken,
  exchangeCodeForToken,
  exchangeToLongLivedToken,
  extractIdsFromGranularScopes,
  generateRegistrationPin,
  getPhoneNumberDetails,
  listPhoneNumbersForWaba,
  MetaApiError,
  registerPhoneNumber,
  subscribeWaba,
} from '@/lib/whatsapp/meta-client'
import {
  setIntegrationError,
  upsertIntegration,
} from '@/lib/whatsapp/integrations'

const SETTINGS_PATH = '/dashboard/settings/integrazioni'

function redirectTo(
  req: NextRequest,
  params: Record<string, string>,
): NextResponse {
  const url = new URL(SETTINGS_PATH, req.url)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const errorParam = req.nextUrl.searchParams.get('error')
  const errorReason = req.nextUrl.searchParams.get('error_reason')
  const errorDescription = req.nextUrl.searchParams.get('error_description')

  if (errorParam) {
    return redirectTo(req, {
      status: 'error',
      reason: errorReason ?? errorParam,
      detail: errorDescription ?? '',
    })
  }

  if (!code) {
    return redirectTo(req, { status: 'error', reason: 'missing_code' })
  }

  let session
  try {
    session = await requireRole(['tenant_admin'])
  } catch {
    return redirectTo(req, { status: 'error', reason: 'unauthorized' })
  }

  if (!session.tenantId) {
    return redirectTo(req, { status: 'error', reason: 'no_tenant' })
  }
  const tenantId = session.tenantId

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri) {
    return redirectTo(req, { status: 'error', reason: 'config_missing' })
  }

  try {
    // 1. code → short-lived user token
    const shortToken = await exchangeCodeForToken({
      code,
      appId,
      appSecret,
      redirectUri,
    })

    // 2. short-lived → long-lived (~60 giorni)
    const longToken = await exchangeToLongLivedToken({
      shortToken: shortToken.access_token,
      appId,
      appSecret,
    })
    const token = longToken.access_token
    const tokenExpiresAt =
      longToken.expires_in && longToken.expires_in > 0
        ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
        : null

    // 3. debug_token → estrai waba_id, business_id, granular_scopes
    const debug = await debugToken({
      token,
      appAccessToken: buildAppAccessToken(appId, appSecret),
    })
    const ids = extractIdsFromGranularScopes(debug.granular_scopes)
    const wabaId = ids.wabaIds[0]
    const businessId = ids.businessIds[0] ?? null

    if (!wabaId) {
      return redirectTo(req, {
        status: 'error',
        reason: 'no_waba',
        detail: 'Nessun WABA trovato nei granular_scopes del token',
      })
    }

    // 4. Trova il phone_number_id (granular scope può non includerlo)
    const phoneNumbers = await listPhoneNumbersForWaba({ token, wabaId })
    if (phoneNumbers.length === 0) {
      return redirectTo(req, {
        status: 'error',
        reason: 'no_phone',
        detail: 'Nessun numero WhatsApp trovato sulla WABA',
      })
    }
    const phone = phoneNumbers[0]!
    const phoneNumberId = phone.id

    // 5. Subscribe app webhook alla WABA
    await subscribeWaba({ token, wabaId })

    // 6. Register phone number con PIN 6 cifre
    const pin = generateRegistrationPin()
    try {
      await registerPhoneNumber({ token, phoneNumberId, pin })
    } catch (err) {
      // Se il numero è già registrato Meta torna errore: best-effort,
      // ma se la causa è un altro errore lo propaghiamo.
      if (!(err instanceof MetaApiError) || (err.code !== 133015 && err.code !== 133016)) {
        throw err
      }
    }

    // 7. Dettagli aggiuntivi (best effort)
    let displayPhoneNumber = phone.display_phone_number
    let verifiedName = phone.verified_name
    try {
      const details = await getPhoneNumberDetails({ token, phoneNumberId })
      displayPhoneNumber = details.display_phone_number ?? displayPhoneNumber
      verifiedName = details.verified_name ?? verifiedName
    } catch {
      // ignorato
    }

    // 8. Persist integration (token cifrato via RPC)
    await upsertIntegration({
      meta: {
        tenant_id: tenantId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        business_id: businessId,
        display_phone_number: displayPhoneNumber,
        verified_name: verifiedName,
        token_type: 'user',
        token_expires_at: tokenExpiresAt,
        status: 'connected',
        last_error: null,
        connected_by_user_id: session.id,
      },
      plaintextAccessToken: token,
    })

    return redirectTo(req, {
      status: 'ok',
      phone: displayPhoneNumber ?? '',
    })
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `${err.message} (code=${err.code ?? 'n/a'})`
        : err instanceof Error
          ? err.message
          : 'Unknown error'

    // Logga last_error sull'integration se esiste già
    try {
      await setIntegrationError(tenantId, message)
    } catch {
      // ignorato (integration può non esistere ancora)
    }

    console.error('[whatsapp.callback] error', err)
    return redirectTo(req, {
      status: 'error',
      reason: 'exception',
      detail: message.slice(0, 200),
    })
  }
}
