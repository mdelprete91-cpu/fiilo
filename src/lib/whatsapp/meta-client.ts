// Wrapper sulle Graph API di Meta usate per WhatsApp Business Cloud.
// Tutte le funzioni accettano il token come parametro: nessuna lettura da env
// per evitare di mescolare i tenant.

const GRAPH_VERSION = 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

export class MetaApiError extends Error {
  readonly code: number | null
  readonly subcode: number | null
  readonly fbtraceId: string | null

  constructor(message: string, code: number | null = null, subcode: number | null = null, fbtraceId: string | null = null) {
    super(message)
    this.name = 'MetaApiError'
    this.code = code
    this.subcode = subcode
    this.fbtraceId = fbtraceId
  }
}

interface MetaErrorPayload {
  error?: {
    message?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
    type?: string
  }
}

async function readMeta<T>(res: Response): Promise<T> {
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const err = (json as MetaErrorPayload | null)?.error
    throw new MetaApiError(
      err?.message ?? `Graph API error ${res.status}`,
      err?.code ?? res.status,
      err?.error_subcode ?? null,
      err?.fbtrace_id ?? null,
    )
  }

  return (json ?? {}) as T
}

// ─── OAuth ──────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
}

export async function exchangeCodeForToken(input: {
  code: string
  appId: string
  appSecret: string
  redirectUri: string
}): Promise<TokenResponse> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', input.appId)
  url.searchParams.set('client_secret', input.appSecret)
  url.searchParams.set('redirect_uri', input.redirectUri)
  url.searchParams.set('code', input.code)

  const res = await fetch(url.toString(), { method: 'GET' })
  return readMeta<TokenResponse>(res)
}

export async function exchangeToLongLivedToken(input: {
  shortToken: string
  appId: string
  appSecret: string
}): Promise<TokenResponse> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', input.appId)
  url.searchParams.set('client_secret', input.appSecret)
  url.searchParams.set('fb_exchange_token', input.shortToken)

  const res = await fetch(url.toString(), { method: 'GET' })
  return readMeta<TokenResponse>(res)
}

// ─── Debug token (estrae waba_id, phone_number_id, business_id, scopes) ─────

export interface GranularScope {
  scope: string
  target_ids?: string[]
}

export interface DebugTokenData {
  app_id: string
  type: string
  application: string
  expires_at: number | null
  is_valid: boolean
  user_id?: string
  granular_scopes?: GranularScope[]
}

export async function debugToken(input: {
  token: string
  appAccessToken: string
}): Promise<DebugTokenData> {
  const url = new URL(`${GRAPH_BASE}/debug_token`)
  url.searchParams.set('input_token', input.token)
  // Per /debug_token Meta richiede un access_token "amministrativo".
  // Lo standard è app_access_token = `${app_id}|${app_secret}`.
  url.searchParams.set('access_token', input.appAccessToken)

  const res = await fetch(url.toString(), { method: 'GET' })
  const json = await readMeta<{ data: DebugTokenData }>(res)
  return json.data
}

export interface ExtractedIds {
  wabaIds: string[]
  phoneNumberIds: string[]
  businessIds: string[]
}

export function extractIdsFromGranularScopes(scopes: GranularScope[] | undefined): ExtractedIds {
  const result: ExtractedIds = { wabaIds: [], phoneNumberIds: [], businessIds: [] }
  if (!scopes) return result
  for (const s of scopes) {
    if (s.scope === 'whatsapp_business_management' || s.scope === 'whatsapp_business_messaging') {
      if (s.target_ids) result.wabaIds.push(...s.target_ids)
    }
    if (s.scope === 'business_management') {
      if (s.target_ids) result.businessIds.push(...s.target_ids)
    }
  }
  return result
}

// ─── WABA & phone number ────────────────────────────────────────────────────

export interface WabaPhoneNumber {
  id: string
  display_phone_number: string
  verified_name: string
  quality_rating?: string
}

export async function listPhoneNumbersForWaba(input: {
  token: string
  wabaId: string
}): Promise<WabaPhoneNumber[]> {
  const url = new URL(`${GRAPH_BASE}/${input.wabaId}/phone_numbers`)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${input.token}` },
  })
  const json = await readMeta<{ data: WabaPhoneNumber[] }>(res)
  return json.data ?? []
}

export async function getPhoneNumberDetails(input: {
  token: string
  phoneNumberId: string
}): Promise<{ display_phone_number: string; verified_name: string }> {
  const url = new URL(`${GRAPH_BASE}/${input.phoneNumberId}`)
  url.searchParams.set('fields', 'display_phone_number,verified_name')
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${input.token}` },
  })
  return readMeta<{ display_phone_number: string; verified_name: string }>(res)
}

export async function subscribeWaba(input: {
  token: string
  wabaId: string
}): Promise<void> {
  const url = new URL(`${GRAPH_BASE}/${input.wabaId}/subscribed_apps`)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
  })
  await readMeta<{ success?: boolean }>(res)
}

export async function registerPhoneNumber(input: {
  token: string
  phoneNumberId: string
  pin: string
}): Promise<void> {
  const url = new URL(`${GRAPH_BASE}/${input.phoneNumberId}/register`)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      pin: input.pin,
    }),
  })
  await readMeta<{ success?: boolean }>(res)
}

// ─── Messaggistica ──────────────────────────────────────────────────────────

export interface SendMessageResponse {
  messaging_product: string
  contacts?: Array<{ input: string; wa_id: string }>
  messages?: Array<{ id: string }>
}

export async function sendTextMessage(input: {
  token: string
  phoneNumberId: string
  to: string
  body: string
}): Promise<SendMessageResponse> {
  const url = new URL(`${GRAPH_BASE}/${input.phoneNumberId}/messages`)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'text',
      text: { body: input.body },
    }),
  })
  return readMeta<SendMessageResponse>(res)
}

export async function sendTemplateMessage(input: {
  token: string
  phoneNumberId: string
  to: string
  template: string
  languageCode: string
}): Promise<SendMessageResponse> {
  const url = new URL(`${GRAPH_BASE}/${input.phoneNumberId}/messages`)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'template',
      template: { name: input.template, language: { code: input.languageCode } },
    }),
  })
  return readMeta<SendMessageResponse>(res)
}

// ─── Utility ────────────────────────────────────────────────────────────────

export function buildAppAccessToken(appId: string, appSecret: string): string {
  return `${appId}|${appSecret}`
}

export function generateRegistrationPin(): string {
  // 6 cifre. Prima cifra non zero (alcune validazioni Meta lo richiedono).
  const first = Math.floor(Math.random() * 9) + 1
  const rest = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')
  return `${first}${rest}`
}
