import Link from 'next/link'
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

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_production: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  delivered: 'bg-muted text-muted-foreground',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
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

export default async function CustomerAbitiPage({ params }: PageProps) {
  const { tenantSlug } = await params
  const ctx = await requireCustomerContext(tenantSlug)
  const supabase = await createClient()

  // Colonne nuove (submitted_*) non ancora nei types — query untyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: garmentsRaw } = await (supabase.from('garments') as any)
    .select(
      'id, name, type, status, created_at, delivery_eta, total_price, currency, submitted_by_customer, submitted_at',
    )
    .eq('client_id', ctx.clientId)
    .order('created_at', { ascending: false })
  const garments = (garmentsRaw ?? []) as Array<{
    id: string
    name: string | null
    type: string
    status: string
    created_at: string
    delivery_eta: string | null
    total_price: number | null
    currency: string | null
    submitted_by_customer: boolean
    submitted_at: string | null
  }>

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-ink md:text-4xl">I miei abiti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Storico ordini e richieste.
          </p>
        </div>
        <NewOrderButton tenantSlug={tenantSlug} />
      </section>

      <div className="rounded-xl border border-border bg-card">
        {garments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground mb-1">Nessun abito ancora</p>
            <p className="text-xs text-muted-foreground">
              Configura il tuo primo abito per iniziare.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {garments.map((g) => {
              const showPrice = ctx.tenant.show_prices_to_customers && g.total_price != null
              const href =
                g.status === 'draft'
                  ? `/c/${tenantSlug}/nuovo-ordine/${g.id}`
                  : `/c/${tenantSlug}/abiti`
              return (
                <li key={g.id}>
                  <Link
                    href={href}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {g.name ?? TYPE_LABEL[g.type] ?? g.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.delivery_eta
                          ? `Consegna prevista: ${new Date(g.delivery_eta).toLocaleDateString('it-IT')}`
                          : new Date(g.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {showPrice && (
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: g.currency ?? 'EUR',
                            maximumFractionDigits: 0,
                          }).format(g.total_price as number)}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide ${STATUS_TONE[g.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {STATUS_LABEL[g.status] ?? g.status}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
