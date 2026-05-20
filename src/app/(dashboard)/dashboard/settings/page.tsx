import Link from 'next/link'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsForm, type TeamMember } from '@/components/dashboard/SettingsForm'
import { BrandSettingsCard } from '@/components/dashboard/BrandSettingsCard'
import { SiteImportCard } from '@/components/dashboard/SiteImportCard'
import { getIntegrationByTenant } from '@/lib/whatsapp/integrations'

export default async function SettingsPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
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
    <div className="min-h-full space-y-6 bg-background px-6 py-8 lg:px-8">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl leading-none text-ink">Impostazioni</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tenant.name}</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">
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

        {session.role === 'tenant_admin' && (
          <>
            <SiteImportCard
              tenantName={tenant.name}
              currentWebsiteUrl={(tenant as { website_url?: string | null }).website_url ?? null}
              currentLogoUrl={tenant.logo_url}
              currentBrandColor={tenant.brand_color}
            />
            <BrandSettingsCard
              tenantName={tenant.name}
              currentLogoUrl={tenant.logo_url}
              currentBrandColor={tenant.brand_color}
            />
          </>
        )}

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
