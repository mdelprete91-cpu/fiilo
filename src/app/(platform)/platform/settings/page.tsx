import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import {
  PlatformSettingsForm,
  type PlatformOwner,
} from '@/components/platform/PlatformSettingsForm'

export default async function PlatformSettingsPage() {
  const session = await requireRole(['platform_owner'])
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: totalClients },
    { count: totalGarments },
    { data: profile },
    { data: roles },
    { data: profiles },
    authResult,
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('garments').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('created_at').eq('id', session.id).single(),
    supabase
      .from('user_tenant_roles')
      .select('id, user_id, created_at')
      .is('tenant_id', null)
      .eq('role', 'platform_owner')
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, full_name'),
    createServiceClient().then((s) => s.auth.admin.listUsers({ perPage: 1000 })),
  ])

  const authUsers = authResult.data?.users ?? []
  const owners: PlatformOwner[] = (roles ?? []).map((r) => ({
    roleId: r.id,
    userId: r.user_id,
    name: profiles?.find((p) => p.id === r.user_id)?.full_name ?? null,
    email: authUsers.find((u) => u.id === r.user_id)?.email ?? null,
  }))

  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="min-h-full space-y-6 bg-background px-6 py-8 lg:px-8">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl leading-none text-ink">Impostazioni</h1>
          <p className="mt-2 text-sm text-muted-foreground">Piattaforma</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <PlatformSettingsForm
          profile={{
            full_name: session.fullName,
            email: session.email,
          }}
          stats={{
            totalTenants: totalTenants ?? 0,
            totalClients: totalClients ?? 0,
            totalGarments: totalGarments ?? 0,
          }}
          joinedAt={joinedAt}
          owners={owners}
          currentUserId={session.id}
        />
      </div>
    </div>
  )
}
