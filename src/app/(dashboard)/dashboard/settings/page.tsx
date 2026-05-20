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
import { BrandSettingsCard } from '@/components/dashboard/BrandSettingsCard'
import { getIntegrationByTenant } from '@/lib/whatsapp/integrations'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: 'sartoria', label: 'Sartoria' },
  { value: 'team', label: 'Team' },
  { value: 'profilo', label: 'Profilo' },
]

function isValidTab(t: string | undefined): t is SettingsTab {
  return t === 'sartoria' || t === 'team' || t === 'profilo'
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const { tab: tabRaw } = await searchParams
  const tab: SettingsTab = isValidTab(tabRaw) ? tabRaw : 'sartoria'

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
      <div className="border-b border-border bg-background">
        <div className="px-6 py-8 lg:px-8">
          <div className="flex items-start gap-3">
            <TopBar role={session.role} userName={session.fullName ?? session.email} />
            <div>
              <h1 className="font-heading text-5xl leading-none text-ink">Impostazioni</h1>
              <p className="mt-2 text-sm text-muted-foreground">{tenant.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="-mb-px mt-8 flex gap-1 border-b border-border" aria-label="Tabs">
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

        {tab === 'sartoria' && session.role === 'tenant_admin' && (
          <>
            <BrandSettingsCard
              tenantName={tenant.name}
              currentLogoUrl={tenant.logo_url}
              currentBrandColor={tenant.brand_color}
            />

            <Link
              href="/dashboard/settings/integrazioni"
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-4 pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Integrazioni
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Collega WhatsApp Business e altri strumenti.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="inline-flex items-center gap-2 text-sm text-foreground">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  WhatsApp Business
                </span>
                <span className={`text-xs font-medium ${waStatusTone}`}>
                  {waStatusLabel}
                </span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
