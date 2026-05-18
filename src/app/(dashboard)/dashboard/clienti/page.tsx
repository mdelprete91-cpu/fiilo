import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { tokenize, ilikeOrClause } from '@/lib/search'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

const CLIENT_SEARCH_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'city']

export default async function ClientiPage({ searchParams }: PageProps) {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const { q } = await searchParams
  const supabase = await createClient()
  const tid = session.tenantId!

  const tokens = tokenize(q)

  let query = supabase
    .from('clients')
    .select('id, first_name, last_name, email, phone, city, created_at')
    .eq('tenant_id', tid)
    .order('last_name', { ascending: true })

  for (const token of tokens) {
    query = query.or(ilikeOrClause(token, CLIENT_SEARCH_FIELDS))
  }

  // Ricerca anche nei messaggi WhatsApp: tutti i token devono comparire nel body.
  let waClientIds: string[] = []
  if (tokens.length > 0) {
    let waQuery = supabase
      .from('whatsapp_messages')
      .select('client_id')
      .eq('tenant_id', tid)
      .not('client_id', 'is', null)
    for (const token of tokens) {
      waQuery = waQuery.ilike('body', `%${token}%`)
    }
    const { data: waMatches } = await waQuery.limit(500)
    waClientIds = Array.from(
      new Set((waMatches ?? []).map((m) => m.client_id).filter((id): id is string => !!id)),
    )
  }

  const [{ data: primaryClients }, { data: garments }] = await Promise.all([
    query.limit(100),
    supabase
      .from('garments')
      .select('client_id, status, total_price')
      .eq('tenant_id', tid),
  ])

  const primaryIds = new Set((primaryClients ?? []).map((c) => c.id))
  const extraIds = waClientIds.filter((id) => !primaryIds.has(id))

  let waOnlyClients: typeof primaryClients = []
  if (extraIds.length > 0) {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, city, created_at')
      .eq('tenant_id', tid)
      .in('id', extraIds)
      .order('last_name', { ascending: true })
    waOnlyClients = data ?? []
  }

  const waMatchedIds = new Set(waClientIds)
  const clients = [...(primaryClients ?? []), ...(waOnlyClients ?? [])]

  // Conteggi per cliente calcolati lato JS
  const richiesti = new Map<string, number>()
  const consegnati = new Map<string, number>()
  const fatturato = new Map<string, number>()
  for (const g of garments ?? []) {
    richiesti.set(g.client_id, (richiesti.get(g.client_id) ?? 0) + 1)
    if (g.status === 'delivered') {
      consegnati.set(g.client_id, (consegnati.get(g.client_id) ?? 0) + 1)
    }
    if (g.total_price != null && g.status !== 'draft' && g.status !== 'cancelled') {
      fatturato.set(g.client_id, (fatturato.get(g.client_id) ?? 0) + g.total_price)
    }
  }

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">
      {/* Page header — Loom style: mobile hamburger + title + subtitle + action */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Mobile hamburger è dentro TopBar */}
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Clienti</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {clients?.length
                ? `${clients.length} client${clients.length === 1 ? 'e' : 'i'} in rubrica`
                : 'Gestisci la tua rubrica clienti'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/clienti/nuovo"
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors will-change-transform"
        >
          <Plus className="h-4 w-4" />
          Nuovo cliente
        </Link>
      </div>

      {/* Search */}
      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome, telefono, email o un dettaglio dei messaggi…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
        />
      </form>

      {/* Tabella */}
      <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Cliente
              </th>
              <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">
                Email
              </th>
              <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">
                Telefono
              </th>
              <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">
                Città
              </th>
              <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">
                Cliente dal
              </th>
              <th className="hidden px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground xl:table-cell">
                Ordini richiesti
              </th>
              <th className="hidden px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground xl:table-cell">
                Ordini consegnati
              </th>
              <th className="hidden px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground xl:table-cell">
                Fatturato
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(clients ?? []).map((c) => (
              <tr
                key={c.id}
                className="group hover:bg-muted/30 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-background uppercase">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <span className="font-medium text-foreground">
                      {c.last_name} {c.first_name}
                    </span>
                    {waMatchedIds.has(c.id) && !primaryIds.has(c.id) && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        nei messaggi
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                  {c.email ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground lg:table-cell">
                  {c.phone ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground lg:table-cell">
                  {c.city ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                  {new Date(c.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="hidden px-5 py-4 text-right xl:table-cell">
                  <span className="tabular-nums font-medium text-foreground">
                    {richiesti.get(c.id) ?? 0}
                  </span>
                </td>
                <td className="hidden px-5 py-4 text-right xl:table-cell">
                  <span className="tabular-nums font-medium text-foreground">
                    {consegnati.get(c.id) ?? 0}
                  </span>
                </td>
                <td className="hidden px-5 py-4 text-right xl:table-cell">
                  <span className="tabular-nums font-medium text-foreground">
                    {fatturato.get(c.id) != null
                      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fatturato.get(c.id)!)
                      : <span className="text-muted-foreground/40">—</span>}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/clienti/${c.id}`}
                    className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Apri →
                  </Link>
                </td>
              </tr>
            ))}
            {!clients?.length && (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {q ? `Nessun risultato per "${q}"` : 'Nessun cliente ancora'}
                  </p>
                  {!q && (
                    <>
                      <p className="text-xs text-muted-foreground mb-4">
                        Inizia aggiungendo il primo cliente alla tua rubrica.
                      </p>
                      <Link
                        href="/dashboard/clienti/nuovo"
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Aggiungi il primo →
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
  )
}
