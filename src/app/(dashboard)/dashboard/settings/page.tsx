import Link from 'next/link'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import {
  SettingsForm,
  type TeamMember,
  type SettingsTab,
} from '@/components/dashboard/SettingsForm'
import { getIntegrationByTenant } from '@/lib/whatsapp/integrations'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

type PageTab = SettingsTab | 'integrazioni'

const TABS: Array<{ value: PageTab; label: string }> = [
  { value: 'sartoria', label: 'Sartoria' },
  { value: 'team', label: 'Team' },
  { value: 'integrazioni', label: 'Integrazioni' },
  { value: 'profilo', label: 'Profilo' },
]

function isValidTab(t: string | undefined): t is PageTab {
  return t === 'sartoria' || t === 'team' || t === 'integrazioni' || t === 'profilo'
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const { tab: tabRaw } = await searchParams
  const tab: PageTab = isValidTab(tabRaw) ? tabRaw : 'sartoria'

  const supabase = await createClient()
  const tid = session.tenantId!

  const [{ data: tenant }, { data: userProfile }] = await Promise.all([
    supabase
      .from('tenants')
      .select('name, email, phone, address, city, plan, created_at, logo_url, brand_color, website_url')
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
  const [{ data: roles }, { data: profiles }, serviceResult] = await Promise.all([
    supabase
      .from('user_tenant_roles')
      .select('id, user_id, role')
      .eq('tenant_id', tid)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, full_name'),
    session.role === 'tenant_admin'
      ? createServiceClient().then((s) => s.auth.admin.listUsers({ perPage: 1000 }))
      : Promise.resolve({ data: { users: [] } }),
  ])

  const authUsers = ('data' in serviceResult ? serviceResult.data?.users : []) ?? []

  team = (roles ?? []).map((r) => ({
    roleId: r.id,
    userId: r.user_id,
    role: r.role,
    name: profiles?.find((p) => p.id === r.user_id)?.full_name ?? null,
    email: authUsers.find((u) => u.id === r.user_id)?.email ?? null,
  }))

  const memberSince = new Date(tenant.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const waIntegration = await getIntegrationByTenant(tid)
  const waStatusLabel =
    waIntegration?.status === 'connected'
      ? 'Connesso'
      : waIntegration?.status === 'error'
        ? 'Errore'
        : 'Non connesso'
  const waStatusTone =
    waIntegration?.status === 'connected'
      ? 'text-emerald-700 dark:text-emerald-400'
      : waIntegration?.status === 'error'
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <div className="min-h-full bg-background">
      {/* Header full-width */}
      <div className="bg-background">
        <div className="px-6 py-8 lg:px-8">
          <div className="flex items-start gap-3">
            <TopBar role={session.role} userName={session.fullName ?? session.email} />
            <div>
              <h1 className="font-heading text-5xl leading-none text-ink">Impostazioni</h1>
              <p className="mt-2 text-sm text-muted-foreground">{tenant.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-8 flex gap-1 border-b border-border" aria-label="Tabs">
            {TABS.map((t) => {
              const active = t.value === tab
              return (
                <Link
                  key={t.value}
                  href={`/dashboard/settings?tab=${t.value}`}
                  scroll={false}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content full-width */}
      <div className="px-6 py-8 lg:px-8 space-y-5">
        {tab !== 'integrazioni' && (
        <SettingsForm
          tab={tab}
          tenant={{
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            address: tenant.address,
            city: tenant.city,
            website_url: (tenant as { website_url?: string | null }).website_url ?? null,
            logo_url: tenant.logo_url,
            brand_color: tenant.brand_color,
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
        )}

        {tab === 'integrazioni' && (
          <div className="space-y-3">
            <Link
              href="/dashboard/settings/integrazioni"
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                    <MessageCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">WhatsApp Business</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ricevi e gestisci i messaggi dei clienti direttamente in filo.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${waStatusTone}`}>
                    {waStatusLabel}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Placeholder per future integrazioni */}
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Altre integrazioni in arrivo
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Email transazionali, calendario, contabilità e altri strumenti.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
