import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'

export default async function PlatformPage() {
  const session = await requireRole(['platform_owner'])
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: totalClients },
    { count: totalGarments },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('garments').select('*', { count: 'exact', head: true }),
  ])

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Overview</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalTenants != null
                ? `${totalTenants} sartor${totalTenants === 1 ? 'ia' : 'ie'} attiv${totalTenants === 1 ? 'a' : 'e'}`
                : 'Gestione sartorie'}
            </p>
          </div>
        </div>
        <Link
          href="/platform/tenants/nuova"
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors will-change-transform"
        >
          + Nuova sartoria
        </Link>
      </div>

      {/* KPI strip */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-border animate-fade-up">
          <KpiCell label="Sartorie attive" value={totalTenants ?? 0} />
          <KpiCell label="Clienti totali" value={totalClients ?? 0} />
          <KpiCell label="Abiti configurati" value={totalGarments ?? 0} />
        </div>
      </div>

      {/* Tenants table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Sartorie
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Nome</th>
                <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">Slug</th>
                <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">Piano</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Stato</th>
                <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">Creata</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants?.map((t) => (
                <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{t.name}</td>
                  <td className="hidden px-5 py-4 font-mono text-xs text-muted-foreground md:table-cell">{t.slug}</td>
                  <td className="hidden px-5 py-4 capitalize text-muted-foreground lg:table-cell">{t.plan}</td>
                  <td className="px-5 py-4">
                    <ActiveBadge active={t.is_active} />
                  </td>
                  <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                    {new Date(t.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Gestisci →
                    </Link>
                  </td>
                </tr>
              ))}
              {!tenants?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-foreground mb-1">Nessuna sartoria registrata</p>
                    <p className="text-xs text-muted-foreground mb-4">Inizia aggiungendo la prima sartoria.</p>
                    <Link href="/platform/tenants/nuova" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      Aggiungi la prima →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KpiCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">
        {value}
      </p>
    </div>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
        <span className="h-1 w-1 rounded-full bg-emerald-500" /> Attiva
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" /> Inattiva
    </span>
  )
}
