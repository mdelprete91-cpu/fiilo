import type React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Edit, Plus, Ruler, Scissors } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { MeasurementTimeline } from '@/components/dashboard/MeasurementTimeline'
import { NuovoAbitoButton } from '@/components/dashboard/NuovoAbitoButton'
import { PaymentStatusToggle } from '@/components/dashboard/PaymentStatusToggle'
import { WhatsAppSection } from '@/components/dashboard/WhatsAppSection'
import { getMessagesForClient } from '@/lib/actions/whatsapp'
import type { ClientMeasurement, Garment } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; msg?: string }>
}

export default async function ClienteDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { error: pageError, msg: pageErrorMsg } = await searchParams
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tid)
    .single()

  if (!client) notFound()

  const [{ data: measurements }, { data: garments }, whatsappMessages] = await Promise.all([
    supabase
      .from('client_measurements')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', tid)
      .order('taken_at', { ascending: false }),
    supabase
      .from('garments')
      .select('id, name, type, status, delivery_eta, created_at, total_price, currency')
      .eq('client_id', id)
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false }),
    getMessagesForClient(id),
  ])

  const latestMeasurement = measurements?.[0] ?? null

  return (
    <div className="min-h-full bg-background space-y-6 p-6 lg:p-8">
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title={`${client.first_name} ${client.last_name}`}
        subtitle={`Cliente dal ${new Date(client.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {pageError === 'create_garment' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-1">
          <p className="font-medium">Impossibile creare il nuovo ordine.</p>
          {pageErrorMsg && <p className="font-mono text-xs opacity-80">{decodeURIComponent(pageErrorMsg)}</p>}
          {pageErrorMsg?.includes('column') && (
            <p className="text-xs opacity-70">→ Applica la migrazione: <code className="font-mono">ALTER TABLE garments ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT &apos;{}&apos;, ADD COLUMN IF NOT EXISTS current_step text NOT NULL DEFAULT &apos;fabric&apos;;</code></p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Anagrafica */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-base font-bold text-background uppercase">
                  {client.first_name[0]}{client.last_name[0]}
                </div>
                <div>
                  <h2 className="font-heading text-xl text-ink leading-tight">
                    {client.first_name} {client.last_name}
                  </h2>
                  {client.city && (
                    <p className="text-sm text-muted-foreground mt-0.5">{client.city}</p>
                  )}
                </div>
              </div>
              <Link
                href={`/dashboard/clienti/${id}/modifica`}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
                title="Modifica"
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              {client.email && (
                <Row label="Email" value={client.email} />
              )}
              {client.phone && (
                <Row label="Telefono" value={client.phone} />
              )}
              {client.date_of_birth && (
                <Row
                  label="Nascita"
                  value={new Date(client.date_of_birth).toLocaleDateString('it-IT')}
                />
              )}
              {client.address && (
                <Row
                  label="Indirizzo"
                  value={`${client.address}${client.city ? `, ${client.city}` : ''}`}
                />
              )}
            </dl>

            {client.notes && (
              <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                {client.notes}
              </div>
            )}
          </div>

          {/* KPI strip */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ordini</p>
                <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">{garments?.length ?? 0}</p>
              </div>
              <div className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Rilevazioni</p>
                <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">{measurements?.length ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Misure */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                <Ruler className="h-3.5 w-3.5" /> Misure
              </h3>
              <Link
                href={`/dashboard/clienti/${id}/misure/nuova`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Nuova rilevazione
              </Link>
            </div>
            <MeasurementTimeline
              measurements={(measurements as ClientMeasurement[]) ?? []}
              latest={latestMeasurement as ClientMeasurement | null}
            />
          </div>
        </div>

        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abiti */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <Scissors className="h-3.5 w-3.5" /> Ordini configurati
              </h3>
              <NuovoAbitoButton clientId={id} />
            </div>
            <ul className="divide-y divide-border">
              {(garments as Garment[] ?? []).map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/dashboard/clienti/${id}/abiti/${g.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {g.name ?? garmentTypeLabel(g.type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.delivery_eta
                          ? `Consegna: ${new Date(g.delivery_eta).toLocaleDateString('it-IT')}`
                          : new Date(g.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {g.total_price != null && (
                        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-ink)' }}>
                          {new Intl.NumberFormat('it-IT', { style: 'currency', currency: g.currency ?? 'EUR', maximumFractionDigits: 0 }).format(g.total_price)}
                        </span>
                      )}
                      {/* PaymentStatusToggle attivo dopo migration 009 */}
                      <StatusBadge status={g.status} />
                    </div>
                  </Link>
                </li>
              ))}
              {!garments?.length && (
                <li className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-foreground mb-1">Nessun abito configurato</p>
                  <p className="text-xs text-muted-foreground">Crea il primo abito per questo cliente.</p>
                </li>
              )}
            </ul>
          </div>

          {/* WhatsApp */}
          <WhatsAppSection messages={whatsappMessages} clientId={id} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: 'Bozza', confirmed: 'Confermato', in_production: 'In prod.',
    ready: 'Pronto', delivered: 'Consegnato', cancelled: 'Annullato',
  }
  const styles: Record<string, React.CSSProperties> = {
    draft:         { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.55 0.02 85)' },
    confirmed:     { background: 'oklch(0.93 0.04 250)', color: 'oklch(0.35 0.07 250)' },
    in_production: { background: 'oklch(0.96 0.06 70)',  color: 'oklch(0.50 0.12 55)' },
    ready:         { background: 'oklch(0.93 0.05 155)', color: 'oklch(0.28 0.07 155)' },
    delivered:     { background: 'oklch(0.90 0.005 85)', color: 'oklch(0.45 0.01 85)' },
    cancelled:     { background: 'oklch(0.95 0.04 25)',  color: 'oklch(0.45 0.12 25)' },
  }
  return (
    <span
      className="text-[10px] px-2.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide"
      style={styles[status] ?? { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.55 0.02 85)' }}
    >
      {labels[status] ?? status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'paid')
    return (
      <span className="text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
        Saldato
      </span>
    )
  if (status === 'partial')
    return (
      <span className="text-[10px] font-semibold tabular-nums text-amber-700 dark:text-amber-300">
        Acconto
      </span>
    )
  return null
}

function garmentTypeLabel(t: string) {
  const m: Record<string, string> = {
    suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Giacca',
    trousers: 'Pantalone', waistcoat: 'Gilet', coat: 'Soprabito',
    tuxedo: 'Smoking', shirt: 'Camicia',
  }
  return m[t] ?? t
}
