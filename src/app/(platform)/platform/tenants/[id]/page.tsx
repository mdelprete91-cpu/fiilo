import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TenantDetailPanel } from '@/components/platform/TenantDetailPanel'
import { TenantStaffPanel } from '@/components/platform/TenantStaffPanel'
import { ImpersonateButton } from '@/components/platform/ImpersonateButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  await requireRole(['platform_owner'])
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  const { data: roles } = await supabase
    .from('user_tenant_roles')
    .select('id, user_id, role, created_at')
    .eq('tenant_id', id)
    .order('created_at')

  const memberIds = roles?.map((r) => r.user_id) ?? []
  const { data: profiles } = memberIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', memberIds)
    : { data: [] }

  const { data: usersData } = memberIds.length > 0
    ? await service.auth.admin.listUsers()
    : { data: { users: [] } }

  const authUsers = usersData?.users ?? []

  const members = (roles ?? []).map((r) => {
    const profile = profiles?.find((p) => p.id === r.user_id)
    const authUser = authUsers.find((u) => u.id === r.user_id)
    return {
      roleId: r.id,
      userId: r.user_id,
      role: r.role,
      fullName: profile?.full_name ?? null,
      email: authUser?.email ?? '—',
      createdAt: r.created_at,
    }
  })

  const [{ count: clientCount }, { count: garmentCount }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('garments').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
  ])

  return (
    <div className="min-h-full bg-background">

      {/* Breadcrumb */}
      <div className="border-b border-border px-6 py-3 bg-card">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/platform" className="hover:text-foreground transition-colors">
            Overview
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-foreground font-medium">{tenant.name}</span>
        </nav>
      </div>

      {/* Page header */}
      <div className="border-b border-border/40 bg-background px-6 py-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-ink leading-tight">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{tenant.slug}</p>
          </div>
          <ImpersonateButton tenantId={id} tenantName={tenant.name} />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3 items-start">

          {/* Left: KPI + details */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="px-6 py-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Clienti</p>
                  <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">{clientCount ?? 0}</p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Abiti</p>
                  <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">{garmentCount ?? 0}</p>
                </div>
              </div>
            </div>
            <TenantDetailPanel tenant={tenant} />
          </div>

          {/* Right: staff */}
          <div className="lg:col-span-2">
            <TenantStaffPanel tenantId={id} members={members} />
          </div>

        </div>
      </div>
    </div>
  )
}
