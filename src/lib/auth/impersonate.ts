'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireRole } from './session'

const COOKIE = 'impersonate_tenant_id'

export async function startImpersonationAction(tenantId: string) {
  await requireRole(['platform_owner'])
  const jar = await cookies()
  jar.set(COOKIE, tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // scade alla fine della sessione browser
  })
  redirect('/dashboard')
}

export async function stopImpersonationAction() {
  const jar = await cookies()
  jar.delete(COOKIE)
  redirect('/platform')
}

export async function getImpersonatedTenantId(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE)?.value ?? null
}
