import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { PortalTenant } from '@/types/customer-portal'

export interface CustomerContext {
  tenant: PortalTenant
  tenantSlug: string
  clientId: string
  userId: string
  fullName: string | null
}

/**
 * Server-side guard per le pagine customer. Garantisce:
 *  - tenant esiste (via RPC pubblica)
 *  - utente è customer_end_user del tenant
 *  - se non lo è → redirect a /c/[slug]/login
 */
export async function requireCustomerContext(
  tenantSlug: string,
): Promise<CustomerContext> {
  const supabase = await createClient()
  // RPC nuova (migration 021), non ancora nei types autogenerati.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantRow } = await (supabase.rpc as any)(
    'portal_get_tenant_by_slug',
    { p_slug: tenantSlug },
  )
  const tenant = Array.isArray(tenantRow)
    ? (tenantRow[0] as PortalTenant | undefined)
    : (tenantRow as PortalTenant | null | undefined)
  if (!tenant) redirect(`/c/${tenantSlug}/login`)

  const session = await getSession()
  if (!session || session.role !== 'customer_end_user' || !session.clientId) {
    redirect(`/c/${tenantSlug}/login`)
  }
  if (session.tenantId !== tenant.id) {
    redirect(`/c/${tenantSlug}/login`)
  }

  return {
    tenant,
    tenantSlug,
    clientId: session.clientId,
    userId: session.id,
    fullName: session.fullName,
  }
}
