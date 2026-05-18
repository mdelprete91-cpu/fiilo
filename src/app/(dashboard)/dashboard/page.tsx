import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PanoramicaView, type PanoramicaGarment } from '@/components/dashboard/PanoramicaView'

export default async function DashboardPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const [{ data: rawGarments }, { data: rawClients }] = await Promise.all([
    supabase
      .from('garments')
      .select('id, name, type, status, total_price, currency, delivery_eta, updated_at, created_at, client_id, payment_mode, payment_status, deposit_amount')
      .eq('tenant_id', tid)
      .not('status', 'in', '("draft","cancelled")')
      .order('updated_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('tenant_id', tid),
  ])

  const hasClients = (rawClients?.length ?? 0) > 0

  const clientMap = new Map(
    (rawClients ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`]),
  )

  const garments: PanoramicaGarment[] = (rawGarments ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    status: g.status,
    total_price: g.total_price,
    currency: g.currency,
    delivery_eta: g.delivery_eta,
    updated_at: g.updated_at,
    created_at: g.created_at,
    client_id: g.client_id,
    clientName: clientMap.get(g.client_id) ?? '—',
    payment_mode: g.payment_mode,
    payment_status: g.payment_status,
    deposit_amount: g.deposit_amount,
  }))

  const now = new Date()
  const hour = parseInt(
    now.toLocaleString('it-IT', { timeZone: 'Europe/Rome', hour: 'numeric', hour12: false }),
    10,
  )
  const greeting = hour >= 18 ? 'Buonasera' : 'Buongiorno'
  const firstName = session.fullName?.split(' ')[0] ?? session.email?.split('@')[0] ?? ''

  const dateLabel = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="h-full flex flex-col bg-background px-6 py-8 lg:px-8">
      <div className="shrink-0 flex items-start gap-3 mb-8">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl text-ink leading-none">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>
      </div>

      {!hasClients && (
        <div className="shrink-0 mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-heading text-xl text-ink leading-tight">
                Benvenuto in filo
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inizia creando il tuo primo cliente.
              </p>
            </div>
            <Link
              href="/dashboard/clienti/nuovo"
              className="shrink-0 inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors will-change-transform sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Crea cliente
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <PanoramicaView garments={garments} />
      </div>
    </div>
  )
}
