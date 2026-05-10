import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PlatformSettingsForm } from '@/components/platform/PlatformSettingsForm'

export default async function PlatformSettingsPage() {
  const session = await requireRole(['platform_owner'])
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: totalClients },
    { count: totalGarments },
    { data: profile },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('garments').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('created_at').eq('id', session.id).single(),
  ])

  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-8">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl text-ink leading-none">Impostazioni</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Piattaforma</p>
        </div>
      </div>

      <div className="max-w-2xl">
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
        />
      </div>
    </div>
  )
}
