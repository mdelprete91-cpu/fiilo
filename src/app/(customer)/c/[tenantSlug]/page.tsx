import Link from 'next/link'
import { ArrowRight, Scissors } from 'lucide-react'
import { requireCustomerContext } from '@/lib/auth/customer-guard'
import { createClient } from '@/lib/supabase/server'
import { NewOrderButton } from '@/components/customer/NewOrderButton'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Bozza',
  submitted: 'In attesa di conferma',
  confirmed: 'Confermato',
  in_production: 'In lavorazione',
  ready: 'Pronto',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi',
  suit_3pc: 'Abito 3 pezzi',
  jacket: 'Giacca',
  trousers: 'Pantalone',
  waistcoat: 'Gilet',
  coat: 'Soprabito',
  tuxedo: 'Smoking',
  shirt: 'Camicia',
}

export default async function CustomerHomePage({ params }: PageProps) {
  const { tenantSlug } = await params
  const ctx = await requireCustomerContext(tenantSlug)

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('first_name, last_name')
    .eq('id', ctx.clientId)
    .single()

  const { data: garments } = await supabase
    .from('garments')
    .select('id, name, type, status, created_at, delivery_eta')
    .eq('client_id', ctx.clientId)
    .order('created_at', { ascending: false })
    .limit(5)

  const firstName = client?.first_name ?? 'cliente'

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-10">
      <section className="space-y-3">
        <h1 className="font-heading text-4xl text-ink md:text-5xl">
          Ciao {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bentornato nel portale di {ctx.tenant.name}. Qui trovi le tue misure,
          il catalogo e i tuoi abiti.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <NewOrderButton tenantSlug={tenantSlug} />
        <Link
          href={`/c/${tenantSlug}/catalogo`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted/50"
        >
          Sfoglia il catalogo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            I tuoi abiti recenti
          </h2>
          {garments && garments.length > 0 && (
            <Link
              href={`/c/${tenantSlug}/abiti`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Vedi tutti
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          {!garments || garments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Scissors className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Nessun abito ancora.
              </p>
              <p className="text-xs text-muted-foreground">
                Configura il tuo primo abito su misura.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {garments.map((g) => (
                <li key={g.id}>
                  <Link
                    href={
                      g.status === 'draft'
                        ? `/c/${tenantSlug}/nuovo-ordine/${g.id}`
                        : `/c/${tenantSlug}/abiti`
                    }
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {g.name ?? TYPE_LABEL[g.type] ?? g.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(g.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <StatusBadge status={g.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="text-[10px] px-2.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
