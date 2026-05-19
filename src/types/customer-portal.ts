// Nuovi tipi introdotti dalla migration 021 — definiti qui per non
// rigenerare src/types/database.ts (vedi vincoli AGENTS).

export type CustomerEndUserRole = 'customer_end_user'

export interface ClientUserLink {
  client_id: string
  user_id: string
  tenant_id: string
  invited_at: string
  last_seen_at: string | null
}

export interface CustomerInvite {
  id: string
  created_at: string
  token: string
  client_id: string
  tenant_id: string
  expires_at: string
  used_at: string | null
  created_by: string | null
}

export interface PortalTenant {
  id: string
  name: string
  logo_url: string | null
  brand_color: string | null
  show_prices_to_customers: boolean
}
