// Repository per public.whatsapp_integrations.
// Tutto via service-role client: il token cifrato non deve transitare
// dal client e le RPC pgcrypto richiedono service_role.

import { createClient } from '@supabase/supabase-js'

export type WhatsAppIntegrationStatus = 'pending' | 'connected' | 'error' | 'revoked'
export type WhatsAppTokenType = 'user' | 'system_user'

export interface WhatsAppIntegration {
  id: string
  created_at: string
  updated_at: string
  tenant_id: string
  phone_number_id: string
  waba_id: string
  business_id: string | null
  display_phone_number: string | null
  verified_name: string | null
  token_type: WhatsAppTokenType | null
  token_expires_at: string | null
  status: WhatsAppIntegrationStatus
  last_error: string | null
  connected_at: string | null
  connected_by_user_id: string | null
}

export interface UpsertIntegrationInput {
  tenant_id: string
  phone_number_id: string
  waba_id: string
  business_id?: string | null
  display_phone_number?: string | null
  verified_name?: string | null
  token_type?: WhatsAppTokenType | null
  token_expires_at?: string | null
  status?: WhatsAppIntegrationStatus
  last_error?: string | null
  connected_by_user_id?: string | null
}

const SELECT_COLUMNS =
  'id, created_at, updated_at, tenant_id, phone_number_id, waba_id, business_id, ' +
  'display_phone_number, verified_name, token_type, token_expires_at, status, ' +
  'last_error, connected_at, connected_by_user_id'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function getEncryptionKey(): string {
  const key = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
  if (!key || key.length < 16) {
    throw new Error(
      'WHATSAPP_TOKEN_ENCRYPTION_KEY mancante o troppo corta (min 16 char). Settala su Vercel e in .env.local.',
    )
  }
  return key
}

// Treat "table not in schema cache" (PGRST205) as "no integration": permette di usare
// la UI anche prima che la migration 019 sia applicata in DB.
function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST205'
}

export async function getIntegrationByPhoneNumberId(
  phoneNumberId: string,
): Promise<WhatsAppIntegration | null> {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('whatsapp_integrations')
    .select(SELECT_COLUMNS)
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()
  if (error) {
    if (isTableMissing(error)) return null
    throw error
  }
  return (data as unknown as WhatsAppIntegration | null) ?? null
}

export async function getIntegrationByTenant(
  tenantId: string,
): Promise<WhatsAppIntegration | null> {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('whatsapp_integrations')
    .select(SELECT_COLUMNS)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (error) {
    if (isTableMissing(error)) return null
    throw error
  }
  return (data as unknown as WhatsAppIntegration | null) ?? null
}

export async function upsertIntegration(input: {
  meta: UpsertIntegrationInput
  plaintextAccessToken: string
}): Promise<WhatsAppIntegration> {
  const supabase = adminClient()

  // Upsert via tenant_id (unique). Inseriamo un placeholder bytea per
  // soddisfare il NOT NULL e poi sovrascriviamo con la RPC cifrata.
  const { data, error } = await supabase
    .from('whatsapp_integrations')
    .upsert(
      {
        tenant_id: input.meta.tenant_id,
        phone_number_id: input.meta.phone_number_id,
        waba_id: input.meta.waba_id,
        business_id: input.meta.business_id ?? null,
        display_phone_number: input.meta.display_phone_number ?? null,
        verified_name: input.meta.verified_name ?? null,
        token_type: input.meta.token_type ?? null,
        token_expires_at: input.meta.token_expires_at ?? null,
        status: input.meta.status ?? 'connected',
        last_error: input.meta.last_error ?? null,
        connected_by_user_id: input.meta.connected_by_user_id ?? null,
        connected_at:
          input.meta.status === 'connected' || !input.meta.status
            ? new Date().toISOString()
            : null,
        // Placeholder, sovrascritto subito sotto via RPC pgp_sym_encrypt
        access_token_encrypted: '\\x00',
      },
      { onConflict: 'tenant_id' },
    )
    .select(SELECT_COLUMNS)
    .single()

  if (error || !data) throw error ?? new Error('Upsert integration failed')

  const integration = data as unknown as WhatsAppIntegration

  const { error: rpcError } = await supabase.rpc('set_wa_token', {
    p_integration_id: integration.id,
    p_plaintext: input.plaintextAccessToken,
    p_key: getEncryptionKey(),
  })
  if (rpcError) throw rpcError

  return integration
}

export async function setIntegrationError(
  tenantId: string,
  message: string,
): Promise<void> {
  const supabase = adminClient()
  await supabase
    .from('whatsapp_integrations')
    .update({ status: 'error', last_error: message })
    .eq('tenant_id', tenantId)
}

export async function disconnectIntegration(tenantId: string): Promise<void> {
  const supabase = adminClient()
  await supabase
    .from('whatsapp_integrations')
    .update({ status: 'revoked' })
    .eq('tenant_id', tenantId)
}

export async function decryptToken(integrationId: string): Promise<string | null> {
  const supabase = adminClient()
  const { data, error } = await supabase.rpc('get_wa_token', {
    p_integration_id: integrationId,
    p_key: getEncryptionKey(),
  })
  if (error) throw error
  return (data as string | null) ?? null
}
