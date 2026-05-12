import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'

interface PageProps {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>
}

export default async function PlatformTenantsPage({ searchParams }: PageProps) {
  const session = await requireRole(['platform_owner'])
  const { q, plan, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('tenants')
    .select('id, name, slug, plan, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (q?.trim()) {
    query = query.or(`name.ilike.%${q.trim()}%,slug.ilike.%${q.trim()}%`)
  }
  if (plan && ['starter', 'professional', 'enterprise'].includes(plan)) {
    query = query.eq('plan', plan as 'starter' | 'professional' | 'enterprise')
  }
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data: tenants, count } = await query

  const hasFilters = !!(q || plan || status)

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Sartorie</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {count != null
                ? `${count} sartori${count === 1 ? 'a' : 'e'} registrat${count === 1 ? 'a' : 'e'}`
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

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Cerca per nome o slug..."
          className="flex-1 min-w-48 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        />
        <select
          name="plan"
          defaultValue={plan ?? ''}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        >
          <option value="">Tutti i piani</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        >
          <option value="">Tutti gli stati</option>
          <option value="active">Attive</option>
          <option value="inactive">Inattive</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Filtra
        </button>
        {hasFilters && (
          <a
            href="/platform/tenants"
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Reimposta
          </a>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Sartorie
          </p>
          {count != null && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {count} risultat{count === 1 ? 'o' : 'i'}
            </span>
          )}
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
                    {hasFilters ? (
                      <>
                        <p className="text-sm font-medium text-foreground mb-1">Nessun risultato</p>
                        <p className="text-xs text-muted-foreground mb-4">Prova a modificare i filtri di ricerca.</p>
                        <a href="/platform/tenants" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                          Reimposta filtri →
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground mb-1">Nessuna sartoria registrata</p>
                        <p className="text-xs text-muted-foreground mb-4">Inizia aggiungendo la prima sartoria.</p>
                        <Link href="/platform/tenants/nuova" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                          Aggiungi la prima →
                        </Link>
                      </>
                    )}
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

function ActiveBadge({ active }: { active: boolean }) {
  const style = active
    ? { background: 'oklch(0.93 0.05 155)', color: 'oklch(0.28 0.07 155)' }
    : { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.55 0.02 85)' }
  return (
    <span
      className="text-[10px] px-2.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide"
      style={style}
    >
      {active ? 'Attiva' : 'Inattiva'}
    </span>
  )
}
