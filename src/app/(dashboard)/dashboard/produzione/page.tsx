import { Search } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { ProduzioneBoard, type GarmentRow } from '@/components/dashboard/ProduzioneBoard'
import { NuovoAbitoModal } from '@/components/dashboard/NuovoAbitoModal'
import { tokenize, matchesAllTokens } from '@/lib/search'

const TYPE_LABEL_IT: Record<string, string> = {
  suit_2pc: 'abito 2 pezzi', suit_3pc: 'abito 3 pezzi', jacket: 'giacca',
  trousers: 'pantalone', waistcoat: 'gilet', coat: 'soprabito',
  tuxedo: 'smoking', shirt: 'camicia',
}

const STATUS_LABEL_IT: Record<string, string> = {
  confirmed: 'richiesti', in_production: 'in lavorazione',
  ready: 'pronti', delivered: 'consegnati',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ProduzionePage({ searchParams }: PageProps) {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const { q } = await searchParams
  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const supabase = await createClient()
  const tid = session.tenantId!

  // garments.submitted_by_customer è una colonna aggiunta dalla migration 021
  // e non è ancora nei types autogenerati: query untyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const garmentsQuery = (supabase.from('garments') as any)
    .select(
      'id, name, type, status, delivery_eta, client_id, internal_notes, assigned_to, needs_materials, total_price, deposit_amount, payment_status, submitted_by_customer',
    )
    .eq('tenant_id', tid)
    .not('status', 'in', '("draft","cancelled")')
    .order('delivery_eta', { ascending: true, nullsFirst: false })

  const [{ data: rawGarments }, { data: rawClients }, { data: rawRoles }] = await Promise.all([
    garmentsQuery,
    supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', tid)
      .order('last_name', { ascending: true }),
    supabase
      .from('user_tenant_roles')
      .select('user_id')
      .eq('tenant_id', tid)
      .in('role', ['tenant_admin', 'tenant_staff']),
  ])

  const garments = (rawGarments ?? []) as Array<{
    id: string
    name: string | null
    type: string
    status: string
    delivery_eta: string | null
    client_id: string
    internal_notes: string | null
    assigned_to: string | null
    needs_materials: boolean | null
    total_price: number | null
    deposit_amount: number | null
    payment_status: string | null
    submitted_by_customer: boolean | null
  }>
  const clients = rawClients ?? []

  const staffIds = (rawRoles ?? []).map((r) => r.user_id)
  const { data: rawStaff } = staffIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', staffIds)
    : { data: [] as { id: string; full_name: string | null }[] }

  const staffList = (rawStaff ?? []).map((p) => ({ id: p.id, name: p.full_name ?? '—' }))
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]))
  const clientMap = new Map(clients.map((c) => [c.id, `${c.first_name} ${c.last_name}`]))

  const allRows: GarmentRow[] = garments.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    status: g.status,
    delivery_eta: g.delivery_eta,
    client_id: g.client_id,
    clientName: clientMap.get(g.client_id) ?? '—',
    internal_notes: g.internal_notes ?? null,
    assigned_to: g.assigned_to ?? null,
    assigneeName: g.assigned_to ? (staffMap.get(g.assigned_to) ?? null) : null,
    needs_materials: g.needs_materials ?? false,
    total_price: g.total_price ?? null,
    deposit_amount: g.deposit_amount ?? null,
    payment_status: g.payment_status ?? null,
    submitted_by_customer: g.submitted_by_customer ?? false,
  }))

  const tokens = tokenize(q)
  const rows = tokens.length
    ? allRows.filter((r) =>
        matchesAllTokens(tokens, () => [
          r.name,
          r.clientName,
          r.internal_notes,
          r.assigneeName,
          TYPE_LABEL_IT[r.type],
          STATUS_LABEL_IT[r.status],
        ]),
      )
    : allRows

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Produzione</h1>
            <p className="mt-2 text-sm text-muted-foreground capitalize">{dateLabel}</p>
          </div>
        </div>
        <div className="shrink-0 pt-1">
          <NuovoAbitoModal clients={clients} />
        </div>
      </div>

      {(() => {
        const submitted = allRows.filter((r) => r.status === 'submitted')
        if (submitted.length === 0) return null
        return (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            {submitted.length} {submitted.length === 1 ? 'richiesta' : 'richieste'} dal portale cliente in attesa di conferma.
            Apri la scheda del cliente per rivedere e confermare l&apos;ordine.
          </div>
        )
      })()}

      <form className="max-w-sm space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cliente, tipo, stato, note o referente…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
          />
        </div>
        {tokens.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {rows.length === 0
              ? `Nessun ordine corrisponde a "${q}"`
              : `${rows.length} di ${allRows.length} ordini`}
          </p>
        )}
      </form>

      <ProduzioneBoard garments={rows} staffList={staffList} />
    </div>
  )
}
