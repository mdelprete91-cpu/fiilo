// Registry locale dei template WhatsApp Meta approvati per ciascun tenant.
// Meta richiede che ogni template sia preventivamente sottomesso e approvato
// (24-72h); qui memorizziamo solo lo stato + i metadati necessari ad inviare.

import { createClient } from '@supabase/supabase-js'

export type WhatsAppTemplateStatus = 'pending' | 'approved' | 'rejected'
export type WhatsAppTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type WhatsAppTemplateHeaderType = 'IMAGE' | 'TEXT' | 'none' | null

export interface WhatsAppTemplate {
  id: string
  tenant_id: string
  name: string
  category: WhatsAppTemplateCategory
  language: string
  header_type: WhatsAppTemplateHeaderType
  body_text: string
  variable_count: number
  meta_template_id: string | null
  status: WhatsAppTemplateStatus
  approved_at: string | null
  created_at: string
}

const SELECT_COLUMNS =
  'id, tenant_id, name, category, language, header_type, body_text, ' +
  'variable_count, meta_template_id, status, approved_at, created_at'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// "table not in schema cache" → trattiamo come "non esiste ancora".
function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST205'
}

// Lingua di default Meta: 'it' (codice ISO 2 lettere). Manteniamo l'argomento
// `language` permissivo per supportare future varianti tipo 'it_IT'.
export async function getApprovedTemplate(
  tenantId: string,
  name: string,
  language: string = 'it',
): Promise<WhatsAppTemplate | null> {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('whatsapp_message_templates')
    .select(SELECT_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .eq('language', language)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) {
    if (isTableMissing(error)) return null
    throw error
  }
  return (data as unknown as WhatsAppTemplate | null) ?? null
}

export interface RecordTemplateInput {
  tenant_id: string
  name: string
  category: WhatsAppTemplateCategory
  language: string
  header_type?: WhatsAppTemplateHeaderType
  body_text: string
  variable_count?: number
  meta_template_id?: string | null
  status?: WhatsAppTemplateStatus
}

// Insert/update di un template — usato dall'admin per registrare un template
// già approvato manualmente da Meta. MVP: insert SQL manuale o via questa fn.
export async function recordTemplate(
  input: RecordTemplateInput,
): Promise<WhatsAppTemplate> {
  const supabase = adminClient()
  const payload = {
    tenant_id: input.tenant_id,
    name: input.name,
    category: input.category,
    language: input.language,
    header_type: input.header_type ?? null,
    body_text: input.body_text,
    variable_count: input.variable_count ?? 0,
    meta_template_id: input.meta_template_id ?? null,
    status: input.status ?? 'pending',
    approved_at:
      (input.status ?? 'pending') === 'approved' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('whatsapp_message_templates')
    .upsert(payload, { onConflict: 'tenant_id,name,language' })
    .select(SELECT_COLUMNS)
    .single()

  if (error || !data) throw error ?? new Error('Upsert template failed')
  return data as unknown as WhatsAppTemplate
}
