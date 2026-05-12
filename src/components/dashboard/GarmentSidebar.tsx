'use client'

import { useOptimistic, useTransition, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Pencil, Check, Mail, Phone, MapPin, Edit } from 'lucide-react'
import {
  updateGarmentStatusAction,
  updatePaymentStatusAction,
  updateGarmentDetailsAction,
} from '@/lib/actions/garments'

interface GarmentProps {
  id: string
  status: string
  total_price: number | null
  deposit_amount: number | null
  currency: string
  delivery_eta: string | null
  internal_notes: string | null
  payment_mode: string | null
  payment_status: string
}

interface ClientProps {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  city: string | null
  address: string | null
}

interface Props {
  garment: GarmentProps
  client: ClientProps
  tenantId: string
}

const STATUS_META: Record<string, { label: string; dot: string; next: string | null; nextLabel: string | null }> = {
  confirmed:     { label: 'Confermato',     dot: 'oklch(0.35 0.07 250)',         next: 'in_production', nextLabel: 'Avvia lavorazione' },
  in_production: { label: 'In lavorazione', dot: 'oklch(0.58 0.13 55)',          next: 'ready',         nextLabel: 'Segna come pronto' },
  ready:         { label: 'Pronto',         dot: 'oklch(0.28 0.07 155)',         next: 'delivered',     nextLabel: 'Consegna' },
  delivered:     { label: 'Consegnato',     dot: 'oklch(0.55 0.005 80 / 0.35)', next: null,            nextLabel: null },
}

const PAYMENT_MODE_LABEL: Record<string, string> = {
  deposit: 'Acconto', full: 'Pagamento integrale', on_delivery: 'Alla consegna',
}

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending' as const,  label: 'In attesa' },
  { value: 'partial' as const,  label: 'Acconto' },
  { value: 'paid'    as const,  label: 'Saldato' },
]

function paymentActiveStyle(v: 'pending' | 'partial' | 'paid'): React.CSSProperties {
  if (v === 'paid')    return { backgroundColor: 'oklch(0.28 0.07 155)', color: '#fff', borderColor: 'oklch(0.28 0.07 155)' }
  if (v === 'partial') return { backgroundColor: 'oklch(0.50 0.10 30)',  color: '#fff', borderColor: 'oklch(0.50 0.10 30)' }
  return                      { backgroundColor: 'oklch(0.35 0.07 250)', color: '#fff', borderColor: 'oklch(0.35 0.07 250)' }
}

export function GarmentSidebar({ garment, client }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [optimisticStatus, setOptimisticStatus]               = useOptimistic(garment.status)
  const [optimisticPaymentStatus, setOptimisticPaymentStatus] = useOptimistic(garment.payment_status)

  const [editingEta, setEditingEta] = useState(false)
  const [etaValue,   setEtaValue]   = useState(garment.delivery_eta ?? '')
  const [etaSaving,  setEtaSaving]  = useState(false)

  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput,   setPriceInput]   = useState(garment.total_price != null ? String(garment.total_price) : '')
  const [priceSaving,  setPriceSaving]  = useState(false)

  const [depositInput,  setDepositInput]  = useState(garment.deposit_amount != null ? String(garment.deposit_amount) : '')
  const [depositSaving, setDepositSaving] = useState(false)
  const [depositSaved,  setDepositSaved]  = useState(false)
  const depositTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [notes,      setNotes]      = useState(garment.internal_notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved,  setNotesSaved]  = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const meta = STATUS_META[optimisticStatus] ?? STATUS_META['confirmed']!

  function fmtCurrency(v: number) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency', currency: garment.currency || 'EUR',
      minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2,
    }).format(v)
  }

  const formattedPrice = garment.total_price != null ? fmtCurrency(garment.total_price) : '—'

  async function savePrice() {
    setPriceSaving(true)
    const n = parseFloat(priceInput.replace(',', '.'))
    await updateGarmentDetailsAction(garment.id, { total_price: isNaN(n) ? null : n })
    setPriceSaving(false)
    setEditingPrice(false)
    router.refresh()
  }

  async function saveDeposit() {
    setDepositSaving(true)
    const n = parseFloat(depositInput.replace(',', '.'))
    await updateGarmentDetailsAction(garment.id, { deposit_amount: isNaN(n) ? null : n })
    setDepositSaving(false)
    setDepositSaved(true)
    if (depositTimer.current) clearTimeout(depositTimer.current)
    depositTimer.current = setTimeout(() => setDepositSaved(false), 2500)
    router.refresh()
  }
  const formattedEta = etaValue
    ? new Date(etaValue).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  function advanceStatus(nextStatus: string) {
    startTransition(async () => {
      setOptimisticStatus(nextStatus)
      await updateGarmentStatusAction(garment.id, nextStatus)
      router.refresh()
    })
  }

  function changePaymentStatus(value: 'pending' | 'partial' | 'paid') {
    if (value === optimisticPaymentStatus) return
    startTransition(async () => {
      setOptimisticPaymentStatus(value)
      await updatePaymentStatusAction(garment.id, value)
      router.refresh()
    })
  }

  async function saveEta() {
    setEtaSaving(true)
    await updateGarmentDetailsAction(garment.id, { delivery_eta: etaValue || null })
    setEtaSaving(false)
    setEditingEta(false)
    router.refresh()
  }

  async function saveNotes() {
    setNotesSaving(true)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    await updateGarmentDetailsAction(garment.id, { internal_notes: notes || null })
    setNotesSaving(false)
    setNotesSaved(true)
    notesTimer.current = setTimeout(() => setNotesSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="space-y-3">

      {/* ── Stato & Consegna ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Stato produzione
          </p>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
            <span className="text-sm font-medium text-foreground">{meta.label}</span>
          </div>
          {meta.next && (
            <button
              onClick={() => advanceStatus(meta.next!)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              {meta.nextLabel} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-border/50" />

        {/* Delivery row */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Consegna
          </p>
          {editingEta ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={etaValue}
                onChange={(e) => setEtaValue(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={saveEta}
                disabled={etaSaving}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {etaSaving ? 'Salvo…' : 'Salva'}
              </button>
              <button
                onClick={() => { setEditingEta(false); setEtaValue(garment.delivery_eta ?? '') }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{formattedEta}</span>
              <button
                onClick={() => setEditingEta(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" /> Modifica
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pagamento ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Pagamento
          </p>
        </div>
        <div className="px-5 py-4 space-y-4">

          {/* Prezzo */}
          {editingPrice ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Prezzo totale</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePrice()
                      if (e.key === 'Escape') { setEditingPrice(false); setPriceInput(garment.total_price != null ? String(garment.total_price) : '') }
                    }}
                    autoFocus
                    placeholder="0"
                    className="w-full rounded-md border border-border bg-background pl-7 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
                  />
                </div>
                <button
                  onClick={savePrice}
                  disabled={priceSaving}
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Check className="h-3 w-3" />{priceSaving ? 'Salvo…' : 'Salva'}
                </button>
              </div>
              <button onClick={() => setEditingPrice(false)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Annulla
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Prezzo</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{formattedPrice}</p>
              </div>
              <button
                onClick={() => setEditingPrice(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" /> Modifica
              </button>
            </div>
          )}

          {/* Stato pagamento */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Stato</p>
            <div className="flex rounded-full overflow-hidden border border-border">
              {PAYMENT_STATUS_OPTIONS.map((opt) => {
                const isActive = optimisticPaymentStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => changePaymentStatus(opt.value)}
                    className="flex-1 py-1.5 text-[11px] font-medium transition-colors border-r border-border last:border-r-0"
                    style={isActive ? paymentActiveStyle(opt.value) : undefined}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Acconto — visibile solo quando lo stato è "partial" */}
          {optimisticPaymentStatus === 'partial' && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Acconto versato</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveDeposit() }}
                    placeholder="0"
                    className="w-full rounded-md border border-border bg-background pl-7 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
                  />
                </div>
                <button
                  onClick={saveDeposit}
                  disabled={depositSaving}
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Check className="h-3 w-3" />{depositSaving ? 'Salvo…' : 'Salva'}
                </button>
              </div>
              {/* Da saldare — calcolato quando entrambi i valori sono presenti */}
              {garment.total_price != null && depositInput && !isNaN(parseFloat(depositInput)) && (
                <p className="text-[11px] tabular-nums text-amber-700 dark:text-amber-300">
                  Da saldare: {fmtCurrency(Math.max(0, garment.total_price - parseFloat(depositInput.replace(',', '.'))))}
                </p>
              )}
              {depositSaved && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Salvato</p>
              )}
            </div>
          )}

          {/* Saldato — conferma visiva */}
          {optimisticPaymentStatus === 'paid' && garment.total_price != null && (
            <p className="text-[11px] tabular-nums text-emerald-700 dark:text-emerald-400">
              Importo saldato: {formattedPrice}
            </p>
          )}

        </div>
      </div>

      {/* ── Cliente ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Cliente
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-background uppercase">
              {client.first_name[0]}{client.last_name[0]}
            </div>
            <div>
              <p className="font-heading text-base text-ink leading-tight">
                {client.first_name} {client.last_name}
              </p>
              {client.city && (
                <p className="text-xs text-muted-foreground">{client.city}</p>
              )}
            </div>
          </div>
          <dl className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <a href={`mailto:${client.email}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <a href={`tel:${client.phone}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">
                  {client.address}{client.city ? `, ${client.city}` : ''}
                </span>
              </div>
            )}
          </dl>
        </div>
        <div className="border-t border-border px-5 py-2.5">
          <Link
            href={`/dashboard/clienti/${client.id}`}
            className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            Apri scheda cliente
            <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* ── Note interne ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Note interne
          </p>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }}
            rows={4}
            placeholder="Aggiungi note per uso interno…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] text-emerald-700 transition-opacity dark:text-emerald-400"
              style={{ opacity: notesSaved ? 1 : 0 }}
            >
              Salvato
            </span>
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              {notesSaving ? 'Salvo…' : 'Salva note'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
