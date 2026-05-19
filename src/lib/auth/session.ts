'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { TenantRole, UserTenantRole } from '@/types/database'

// `customer_end_user` viene aggiunto dalla migration 021 ma non è ancora nei
// types autogenerati (vincolo: NON rigenerare database.ts).
export type SessionRole = TenantRole | 'customer_end_user'

export interface SessionUser {
  id: string
  email: string | undefined
  fullName: string | null
  avatarUrl: string | null
  role: SessionRole
  tenantId: string | null
  /** Popolato solo per customer_end_user. */
  clientId: string | null
  isImpersonating: boolean
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileResult, roleResult] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    supabase
      .from('user_tenant_roles')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  if (!roleResult.data) return null

  const baseRole = roleResult.data.role as SessionRole

  // Se il super admin ha un cookie di impersonificazione, sovrascrive il contesto
  if (baseRole === 'platform_owner') {
    const jar = await cookies()
    const impersonateTenantId = jar.get('impersonate_tenant_id')?.value ?? null
    if (impersonateTenantId) {
      return {
        id: user.id,
        email: user.email,
        fullName: profileResult.data?.full_name ?? null,
        avatarUrl: profileResult.data?.avatar_url ?? null,
        role: 'tenant_admin',
        tenantId: impersonateTenantId,
        clientId: null,
        isImpersonating: true,
      }
    }
  }

  // customer_end_user: risolve client_id via JOIN su client_user_links.
  // L'errore "table not in schema cache" è gestito come "feature non ancora
  // disponibile" (migration 021 non applicata).
  let clientId: string | null = null
  if (baseRole === 'customer_end_user') {
    const { data: link } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            eq: (
              c: string,
              v: string,
            ) => { maybeSingle: () => Promise<{ data: { client_id: string } | null }> }
          }
        }
      }
    )
      .from('client_user_links')
      .select('client_id')
      .eq('user_id', user.id)
      .maybeSingle()
    clientId = link?.client_id ?? null
  }

  return {
    id: user.id,
    email: user.email,
    fullName: profileResult.data?.full_name ?? null,
    avatarUrl: profileResult.data?.avatar_url ?? null,
    role: baseRole,
    tenantId: roleResult.data.tenant_id,
    clientId,
    isImpersonating: false,
  }
})

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('Non autenticato')
  return session
}

export async function requireRole<R extends SessionRole>(
  allowedRoles: readonly R[]
): Promise<SessionUser & { role: R }> {
  const session = await requireSession()
  if (!(allowedRoles as readonly SessionRole[]).includes(session.role)) {
    throw new Error('Accesso non autorizzato')
  }
  return session as SessionUser & { role: R }
}

export async function getUserRoles(userId: string): Promise<UserTenantRole[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_tenant_roles')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}
