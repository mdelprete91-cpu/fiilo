import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'

export default async function PlatformPage() {
  const session = await requireRole(['platform_owner'])
  const supabase = await createClient()

  const now = Date.now()
  const cutoff30 = now - 30 * 86_400_000
  const cutoff60 = now - 60 * 86_400_000

  const [
    { count: totalTenants },
    { count: totalClients },
    { count: totalGarments },
    { count: clientsLast30 },
    { count: garmentsInProduction },
    activationsRes,
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('garments').select('*', { count: 'exact', head: true }),
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(cutoff30).toISOString()),
    supabase
      .from('garments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_production'),
    supabase
      .from('tenants')
      .select('created_at')
      .gte('created_at', new Date(cutoff60).toISOString()),
  ])

  // Activations: split degli ultimi 60gg in 30/30 per calcolare delta % MoM.
  let activationsCount = 0
  let prevActivations = 0
  for (const row of activationsRes.data ?? []) {
    const t = new Date(row.created_at).getTime()
    if (t >= cutoff30) activationsCount++
    else if (t >= cutoff60) prevActivations++
  }
  const activationsDelta =
    prevActivations === 0
      ? activationsCount > 0
        ? null
        : 0
      : Math.round(((activationsCount - prevActivations) / prevActivations) * 100)

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const periodLabel = capitalize(
    new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date()),
  )

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Overview</h1>
            <p
              className="mt-3 text-sm italic text-muted-foreground/80 leading-none"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {periodLabel}
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

      {/* KPI strip — card bianca con accenti colorati sulle delta */}
      <div className="overflow-hidden rounded-xl border border-border bg-card animate-fade-up">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <KpiCell
            label="Sartorie attive"
            value={totalTenants ?? 0}
            sub={formatDeltaSub(activationsDelta)}
            subTone={
              activationsDelta != null && activationsDelta > 0
                ? 'positive'
                : activationsDelta != null && activationsDelta < 0
                  ? 'negative'
                  : 'neutral'
            }
          />
          <KpiCell
            label="Clienti totali"
            value={totalClients ?? 0}
            sub={
              (clientsLast30 ?? 0) > 0
                ? `+${clientsLast30} ultimi 30gg`
                : 'Nessun nuovo cliente'
            }
            subTone={(clientsLast30 ?? 0) > 0 ? 'positive' : 'neutral'}
          />
          <KpiCell
            label="Abiti configurati"
            value={totalGarments ?? 0}
            sub={
              (garmentsInProduction ?? 0) > 0
                ? `${garmentsInProduction} in produzione`
                : 'Niente in produzione'
            }
            subTone={(garmentsInProduction ?? 0) > 0 ? 'warning' : 'neutral'}
          />
        </div>
      </div>

      {/* Sartorie — registro editoriale */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-baseline justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Registro sartorie
          </p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {tenants?.length ?? 0} di {totalTenants ?? 0}
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <Th className="text-left">Nome</Th>
                <Th className="hidden text-left md:table-cell">Slug</Th>
                <Th className="hidden text-left lg:table-cell">Piano</Th>
                <Th className="text-left">Stato</Th>
                <Th className="hidden text-left md:table-cell">Creata</Th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants?.map((t) => (
                <tr key={t.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-5 py-4 font-medium text-foreground">{t.name}</td>
                  <td className="hidden px-5 py-4 font-mono text-xs text-muted-foreground md:table-cell">
                    {t.slug}
                  </td>
                  <td className="hidden px-5 py-4 capitalize text-muted-foreground lg:table-cell">
                    {t.plan}
                  </td>
                  <td className="px-5 py-4">
                    <ActiveBadge active={t.is_active} />
                  </td>
                  <td className="hidden px-5 py-4 tabular-nums text-muted-foreground md:table-cell">
                    {new Date(t.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Gestisci →
                    </Link>
                  </td>
                </tr>
              ))}
              {!tenants?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      Nessuna sartoria registrata
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Inizia aggiungendo la prima sartoria.
                    </p>
                    <Link
                      href="/platform/tenants/nuova"
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Aggiungi la prima →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

type SubTone = 'neutral' | 'positive' | 'negative' | 'warning'

const SUB_TONE_CLASSES: Record<SubTone, string> = {
  positive:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  negative:
    'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  warning:
    'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  neutral:
    'bg-secondary text-muted-foreground dark:bg-muted/60',
}

function KpiCell({
  label,
  value,
  sub,
  subTone = 'neutral',
}: {
  label: string
  value: number
  sub?: string
  subTone?: SubTone
}) {
  return (
    <div className="px-6 py-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">
        {value}
      </p>
      {sub && (
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none tabular-nums ${SUB_TONE_CLASSES[subTone]}`}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground ${className}`}
    >
      {children}
    </th>
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

function formatDeltaSub(deltaPct: number | null): string {
  if (deltaPct == null) return 'Nuova attività'
  if (deltaPct === 0) return 'Stabile vs mese scorso'
  const arrow = deltaPct > 0 ? '↑' : '↓'
  const sign = deltaPct > 0 ? '+' : ''
  return `${arrow} ${sign}${deltaPct}% vs mese scorso`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
