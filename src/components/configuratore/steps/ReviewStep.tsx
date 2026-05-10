'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { saveGarmentAction, finalizeGarmentAction } from '@/lib/actions/garments'
import { Section, StepHeader } from '../OptionCard'
import { useCatalog } from '../CatalogContext'

type PaymentMode = 'deposit' | 'full' | 'on_delivery'

const PAYMENT_MODES: { value: PaymentMode; label: string; note: string }[] = [
  { value: 'deposit', label: 'Acconto', note: 'Anticipo + saldo alla consegna' },
  { value: 'full', label: 'Pagamento integrale', note: 'Saldo completo anticipato' },
  { value: 'on_delivery', label: 'Alla consegna', note: 'Saldo intero al ritiro' },
]

const SCHOOL_LABELS: Record<string, string> = {
  napoletana: 'Napoletana', milanese: 'Milanese', inglese: 'Inglese', americana: 'Americana',
}
const BREAST_LABELS: Record<string, string> = { single: 'Monopetto', double: 'Doppiopetto' }
const VENT_LABELS: Record<string, string> = { ventless: 'Senza spacco', single: 'Spacco centrale', double: 'Doppio spacco' }
const LINING_LABELS: Record<string, string> = { full: 'Intera', half: 'Mezza fodera', none: 'Sfoderato' }
const TYPE_LABELS: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Solo giacca',
  trousers: 'Solo pantalone', tuxedo: 'Smoking', coat: 'Cappotto',
  waistcoat: 'Solo gilet', shirt: 'Camicia',
}

interface Props {
  clientName: string
}

export function ReviewStep({ clientName }: Props) {
  const router = useRouter()
  const { fabrics, linings, buttons } = useCatalog()
  const garmentId = useConfiguratoreStore((s) => s.garmentId)
  const clientId = useConfiguratoreStore((s) => s.clientId)
  const garmentName = useConfiguratoreStore((s) => s.garmentName)
  const config = useConfiguratoreStore((s) => s.config)
  const origin = useConfiguratoreStore((s) => s.origin)

  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [price, setPrice] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('deposit')
  const [deposit, setDeposit] = useState('')
  const [eta, setEta] = useState('')

  const { jacket: j, pant: p, colorContrast: c, fabric: f } = config
  const primaryFabric = fabrics.find((fab) => fab.id === f.primaryFabricId)
  const lining = linings.find((l) => l.id === c.liningId)
  const jacketButton = buttons.find((b) => b.id === c.jacketButtonId)

  function returnHomeUrl() {
    if (origin === 'produzione') return '/dashboard/produzione'
    return clientId ? `/dashboard/clienti/${clientId}` : '/dashboard'
  }

  function handleConfirm() {
    if (!garmentId || !clientId) return
    setError(null)

    const total_price = price ? parseFloat(price.replace(',', '.')) : null
    const deposit_amount = deposit ? parseFloat(deposit.replace(',', '.')) : null

    startTransition(async () => {
      const saveRes = await saveGarmentAction(garmentId, garmentName, 'review', config)
      if (!saveRes.success) { setError(saveRes.error); return }

      const finalRes = await finalizeGarmentAction(garmentId, clientId, {
        total_price,
        payment_mode: paymentMode,
        deposit_amount,
        delivery_eta: eta || null,
      })
      if (!finalRes.success) { setError(finalRes.error); return }

      setConfirmed(true)
    })
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="mb-4 size-14 text-primary" />
        <h2 className="mb-2 font-heading text-3xl text-ink">Ordine confermato</h2>
        <p className="mb-6 text-muted-foreground">
          La configurazione è stata salvata e l&apos;ordine inviato in produzione.
        </p>
        <Button size="lg" onClick={() => router.push(returnHomeUrl())}>
          {origin === 'produzione' ? 'Torna a Produzione' : `Torna a ${clientName}`}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <StepHeader
        title="Riepilogo configurazione"
        subtitle={`${clientName} · ${garmentName}`}
      />

      <Section label="Tipo di capo">
        <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
          <Row label="Capo" value={config.garmentType ? TYPE_LABELS[config.garmentType] ?? config.garmentType : '—'} />
        </div>
      </Section>

      <Section label="Tessuto">
        <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
          <Row label="Tessuto principale" value={primaryFabric?.name ?? '—'} />
          {primaryFabric?.mill && <Row label="Mulino" value={primaryFabric.mill} />}
          {primaryFabric?.composition && <Row label="Composizione" value={primaryFabric.composition} />}
        </div>
      </Section>

      <Section label="Giacca">
        <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
          <Row label="Taglio" value={j.cut ?? '—'} />
          <Row label="Scuola" value={j.school ? SCHOOL_LABELS[j.school] ?? '—' : '—'} />
          <Row label="Chiusura" value={j.breast ? BREAST_LABELS[j.breast] ?? '—' : '—'} />
          <Row label="Spalla" value={j.shoulder ?? '—'} />
          <Row label="Bavero" value={j.lapelType ?? '—'} />
          <Row label="Tasche laterali" value={j.sidePocket ?? '—'} />
          <Row
            label="Bottoni manica"
            value={j.sleeveButtonCount !== null ? `${j.sleeveButtonCount}` : '—'}
          />
          <Row label="Spacco" value={j.vent ? VENT_LABELS[j.vent] ?? '—' : '—'} />
          <Row label="Bottoni a bacio" value={j.kissingButtons ? 'Sì' : 'No'} />
          <Row label="Polsino chirurgo" value={j.surgeonsCuffs ? 'Sì' : 'No'} />
          <Row label="Correzione lunghezza" value={`${j.lengthOffset > 0 ? '+' : ''}${j.lengthOffset} cm`} />
        </div>
      </Section>

      <Section label="Pantalone">
        <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
          <Row label="Taglio" value={p.cut ?? '—'} />
          <Row label="Vita" value={p.waist ?? '—'} />
          <Row label="Pinces" value={p.pleat ?? '—'} />
          <Row label="Risvolto" value={p.cuff ? `${p.cuffHeight ?? '?'} cm` : 'No'} />
        </div>
      </Section>

      {config.vest && (
        <Section label="Gilet">
          <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
            <Row label="Chiusura" value={config.vest.breast ? BREAST_LABELS[config.vest.breast] ?? '—' : '—'} />
            <Row label="Bavero" value={config.vest.lapel ?? '—'} />
            <Row label="Dorso" value={config.vest.backMaterial ?? '—'} />
          </div>
        </Section>
      )}

      <Section label="Dettagli e contrasti">
        <div className="space-y-1 rounded-sm border border-border bg-card px-5 py-4">
          <Row label="Fodera" value={lining?.name ?? (c.liningType ? LINING_LABELS[c.liningType] ?? '—' : '—')} />
          <Row label="Flash lining" value={c.flashLining ? 'Sì' : 'No'} />
          <Row label="Bottoni giacca" value={jacketButton?.name ?? '—'} />
          <Row
            label="Monogramma"
            value={c.monogramEnabled && c.monogramText ? c.monogramText : '—'}
          />
          {c.monogramEnabled && c.monogramPosition && (
            <Row label="Posizione monogramma" value={c.monogramPosition} />
          )}
          <Row label="Piping" value={c.pipingEnabled ? c.pipingColor ?? 'Sì' : 'No'} />
        </div>
      </Section>

      <Section label="Prezzo e pagamento">
        <div className="space-y-5 rounded-sm border border-border bg-card p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prezzo totale (€)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2.500"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data consegna prevista</label>
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Modalità di pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMode(m.value)}
                  className={`rounded-sm border px-3 py-2.5 text-left transition-all ${
                    paymentMode === m.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      paymentMode === m.value ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{m.note}</p>
                </button>
              ))}
            </div>
          </div>

          {paymentMode === 'deposit' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Importo acconto (€)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="500"
                className="w-full max-w-[200px] rounded-sm border border-border bg-background px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}
        </div>
      </Section>

      {error && (
        <p className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3 border-t border-border pt-4">
        <Button onClick={handleConfirm} disabled={isPending} size="lg" className="gap-2">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Conferma ordine
        </Button>
        <Button variant="outline" size="lg" onClick={() => router.push(returnHomeUrl())}>
          {origin === 'produzione' ? 'Torna a Produzione' : `Torna a ${clientName}`}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize text-foreground">{value}</span>
    </div>
  )
}
