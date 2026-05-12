import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsForm, type TeamMember } from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const [{ data: tenant }, { data: userProfile }] = await Promise.all([
    supabase
      .from('tenants')
      .select('name, email, phone, address, city, plan, created_at')
      .eq('id', tid)
      .single(),
    supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', session.id)
      .single(),
  ])

  if (!tenant) return null

  let team: TeamMember[] = []
  if (session.role === 'tenant_admin') {
    const [{ data: roles }, { data: profiles }, serviceResult] = await Promise.all([
      supabase
        .from('user_tenant_roles')
        .select('id, user_id, role')
        .eq('tenant_id', tid)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name'),
      createServiceClient().then((s) => s.auth.admin.listUsers({ perPage: 1000 })),
    ])

    const authUsers = serviceResult.data?.users ?? []

    team = (roles ?? []).map((r) => ({
      roleId: r.id,
      userId: r.user_id,
      role: r.role,
      name: profiles?.find((p) => p.id === r.user_id)?.full_name ?? null,
      email: authUsers.find((u) => u.id === r.user_id)?.email ?? null,
    }))
  }

  const memberSince = new Date(tenant.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-full space-y-6 bg-background px-6 py-8 lg:px-8">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl leading-none text-ink">Impostazioni</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tenant.name}</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <SettingsForm
          tenant={{
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            address: tenant.address,
            city: tenant.city,
          }}
          profile={{
            full_name: session.fullName,
            email: session.email,
          }}
          isAdmin={session.role === 'tenant_admin'}
          plan={tenant.plan}
          memberSince={memberSince}
          currentUserId={session.id}
          team={team}
          preferredLanguage={userProfile?.preferred_language ?? 'it'}
        />
      </div>
    </div>
  )
}
