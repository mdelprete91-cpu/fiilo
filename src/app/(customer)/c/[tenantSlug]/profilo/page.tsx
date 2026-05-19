import { requireCustomerContext } from '@/lib/auth/customer-guard'
import { createClient } from '@/lib/supabase/server'
import type { ClientMeasurement } from '@/types/database'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const { tenantSlug } = await params
  const ctx = await requireCustomerContext(tenantSlug)
  const supabase = await createClient()

  const [{ data: client }, { data: measurements }] = await Promise.all([
    supabase
      .from('clients')
      .select('first_name, last_name, email, phone, date_of_birth, address, city, country')
      .eq('id', ctx.clientId)
      .single(),
    supabase
      .from('client_measurements')
      .select('*')
      .eq('client_id', ctx.clientId)
      .order('taken_at', { ascending: false }),
  ])

  const latest = measurements?.[0] as ClientMeasurement | undefined

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      <section className="space-y-2">
        <h1 className="font-heading text-3xl text-ink md:text-4xl">Profilo</h1>
        <p className="text-sm text-muted-foreground">
          Le tue informazioni e le ultime misure prese in sartoria.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Contatti
            </h3>
          </div>
          <dl className="space-y-2.5 px-5 py-4 text-sm">
            <Row label="Nome" value={`${client?.first_name ?? ''} ${client?.last_name ?? ''}`.trim() || '—'} />
            {client?.email && <Row label="Email" value={client.email} />}
            {client?.phone && <Row label="Telefono" value={client.phone} />}
            {client?.date_of_birth && (
              <Row label="Data di nascita" value={new Date(client.date_of_birth).toLocaleDateString('it-IT')} />
            )}
            {(client?.address || client?.city) && (
              <Row
                label="Indirizzo"
                value={[client?.address, client?.city, client?.country].filter(Boolean).join(', ')}
              />
            )}
          </dl>
          <div className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
            Per aggiornare questi dati contatta la sartoria.
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Ultime misure
            </h3>
          </div>
          {latest ? (
            <div className="px-5 py-4 text-sm space-y-2.5">
              <p className="text-xs text-muted-foreground">
                Prese il {new Date(latest.taken_at).toLocaleDateString('it-IT')}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <MeasureRow label="Torace" value={latest.chest} />
                <MeasureRow label="Vita" value={latest.waist} />
                <MeasureRow label="Fianchi" value={latest.hips} />
                <MeasureRow label="Spalle" value={latest.shoulders} />
                <MeasureRow label="Manica" value={latest.sleeve_length} />
                <MeasureRow label="Schiena" value={latest.back_length} />
                <MeasureRow label="Collo" value={latest.neck} />
                <MeasureRow label="Polso" value={latest.wrist} />
                <MeasureRow label="Cavallo" value={latest.crotch} />
                <MeasureRow label="Interno gamba" value={latest.inseam} />
                <MeasureRow label="Esterno gamba" value={latest.outseam} />
                <MeasureRow label="Coscia" value={latest.thigh} />
                <MeasureRow label="Ginocchio" value={latest.knee} />
                <MeasureRow label="Polpaccio" value={latest.calf} />
                <MeasureRow label="Caviglia" value={latest.ankle} />
                <MeasureRow label="Altezza" value={latest.height} />
                <MeasureRow label="Peso" value={latest.weight} />
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nessuna misura ancora.
            </div>
          )}
        </div>
      </section>

      {measurements && measurements.length > 1 && (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Storico
          </h3>
          <div className="rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {measurements.slice(1).map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">
                    {new Date(m.taken_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Torace {m.chest ?? '—'} · Vita {m.waist ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  )
}

function MeasureRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">
        {value != null ? `${value} cm` : '—'}
      </span>
    </div>
  )
}
