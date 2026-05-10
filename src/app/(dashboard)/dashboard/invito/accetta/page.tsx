import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export default async function AccettaInvitoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const pendingTenantId = user.user_metadata?.pending_tenant_id as string | undefined
  const pendingRole = user.user_metadata?.pending_role as string | undefined

  if (!pendingTenantId || !pendingRole) redirect('/dashboard')

  const service = await createServiceClient()

  // Controlla se ha già un ruolo in questo tenant
  const { data: existing } = await supabase
    .from('user_tenant_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', pendingTenantId)
    .maybeSingle()

  if (!existing) {
    await service.from('user_tenant_roles').insert({
      user_id: user.id,
      tenant_id: pendingTenantId,
      role: pendingRole as 'tenant_admin' | 'tenant_staff',
    })

    // Rimuove i metadata dell'invito dal profilo auth
    await service.auth.admin.updateUserById(user.id, {
      user_metadata: { pending_tenant_id: null, pending_role: null },
    })
  }

  redirect('/dashboard')
}
