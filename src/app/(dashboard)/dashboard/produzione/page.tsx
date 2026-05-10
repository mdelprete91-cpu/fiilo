import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { ProduzioneBoard, type GarmentRow } from '@/components/dashboard/ProduzioneBoard'
import { NuovoAbitoModal } from '@/components/dashboard/NuovoAbitoModal'

export default async function ProduzionePage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const supabase = await createClient()
  const tid = session.tenantId!

  const [{ data: rawGarments }, { data: rawClients }, { data: rawRoles }] = await Promise.all([
    supabase
      .from('garments')
      .select('id, name, type, status, delivery_eta, client_id, internal_notes, assigned_to, needs_materials, total_price, deposit_amount, payment_status')
      .eq('tenant_id', tid)
      .not('status', 'in', '("draft","cancelled")')
      .order('delivery_eta', { ascending: true, nullsFirst: false }),
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('tenant_id', tid)
      .order('last_name', { ascending: true }),
    supabase
      .from('user_tenant_roles')
      .select('user_id')
      .eq('tenant_id', tid)
      .in('role', ['tenant_admin', 'tenant_staff']),
  ])

  const garments = rawGarments ?? []
  const clients = rawClients ?? []

  const staffIds = (rawRoles ?? []).map((r) => r.user_id)
  const { data: rawStaff } = staffIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', staffIds)
    : { data: [] as { id: string; full_name: string | null }[] }

  const staffList = (rawStaff ?? []).map((p) => ({ id: p.id, name: p.full_name ?? '—' }))
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]))
  const clientMap = new Map(clients.map((c) => [c.id, `${c.first_name} ${c.last_name}`]))

  const rows: GarmentRow[] = garments.map((g) => ({
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
  }))

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

      <ProduzioneBoard garments={rows} staffList={staffList} />
    </div>
  )
}
