'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { TenantRole, UserTenantRole } from '@/types/database'

export interface SessionUser {
  id: string
  email: string | undefined
  fullName: string | null
  avatarUrl: string | null
  role: TenantRole
  tenantId: string | null
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

  const baseRole = roleResult.data.role

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
        isImpersonating: true,
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    fullName: profileResult.data?.full_name ?? null,
    avatarUrl: profileResult.data?.avatar_url ?? null,
    role: baseRole,
    tenantId: roleResult.data.tenant_id,
    isImpersonating: false,
  }
})

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('Non autenticato')
  return session
}

export async function requireRole(
  allowedRoles: TenantRole[]
): Promise<SessionUser> {
  const session = await requireSession()
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Accesso non autorizzato')
  }
  return session
}

export async function getUserRoles(userId: string): Promise<UserTenantRole[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_tenant_roles')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}
