'use client'

import { useOptimistic, useTransition, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Pencil, Check } from 'lucide-react'
import { updateGarmentStatusAction, updatePaymentStatusAction, updateGarmentDetailsAction } from '@/lib/actions/garments'

interface Props {
  garment: {
    id: string
    name: string | null
    type: string
    status: string
    total_price: number | null
    currency: string
    delivery_eta: string | null
    internal_notes: string | null
    payment_mode: string | null
    payment_status: string
  }
  client: { id: string; first_name: string; last_name: string }
  tenantId: string
  /** Override the outer container class (default: max-w-2xl mx-auto px-6 py-8 space-y-6) */
  className?: string
  /** Override back-link href (default: /dashboard/clienti/[client.id]) */
  backHref?: string
  /** Override back-link label (default: client full name) */
  backLabel?: string
}

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Giacca',
  trousers: 'Pantalone', waistcoat: 'Gilet', coat: 'Soprabito',
  tuxedo: 'Smoking', shirt: 'Camicia',
}

const STATUS_META: Record<string, { label: string; dot: string; next: string | null; nextLabel: string | null }> = {
  confirmed:     { label: 'Confermato',       dot: 'oklch(0.35 0.07 250)',         next: 'in_production', nextLabel: 'Avvia lavorazione' },
  in_production: { label: 'In lavorazione',   dot: 'oklch(0.58 0.13 55)',          next: 'ready',         nextLabel: 'Segna come pronto' },
  ready:         { label: 'Pronto',           dot: 'oklch(0.28 0.07 155)',         next: 'delivered',     nextLabel: 'Consegna' },
  delivered:     { label: 'Consegnato',       dot: 'oklch(0.55 0.005 80 / 0.35)', next: null,            nextLabel: null },
}

const PAYMENT_MODE_LABEL: Record<string, string> = {
  deposit: 'Acconto',
  full: 'Pagamento integrale',
  on_delivery: 'Alla consegna',
}

const PAYMENT_STATUS_OPTIONS: { value: 'pending' | 'partial' | 'paid'; label: string }[] = [
  { value: 'pending',  label: 'In attesa' },
  { value: 'partial',  label: 'Acconto' },
  { value: 'paid',     label: 'Saldato' },
]

function paymentStatusActiveStyle(value: 'pending' | 'partial' | 'paid'): React.CSSProperties {
  if (value === 'paid')    return { backgroundColor: 'oklch(0.28 0.07 155)', color: '#fff', borderColor: 'oklch(0.28 0.07 155)' }
  if (value === 'partial') return { backgroundColor: 'oklch(0.50 0.10 30)',  color: '#fff', borderColor: 'oklch(0.50 0.10 30)' }
  return { backgroundColor: 'oklch(0.35 0.07 250)', color: '#fff', borderColor: 'oklch(0.35 0.07 250)' }
}

export function OrdinePanel({ garment, client, tenantId: _tenantId, className, backHref, backLabel }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(garment.status)
  const [optimisticPaymentStatus, setOptimisticPaymentStatus] = useOptimistic(garment.payment_status)

  // Consegna edit state
  const [editingEta, setEditingEta] = useState(false)
  const [etaValue, setEtaValue] = useState(garment.delivery_eta ?? '')
  const [etaSaving, setEtaSaving] = useState(false)

  // Note interne state
  const [notes, setNotes] = useState(garment.internal_notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const meta = STATUS_META[optimisticStatus] ?? STATUS_META['confirmed']!

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

  const garmentTitle = garment.name ?? TYPE_LABEL[garment.type] ?? garment.type
  const formattedPrice = garment.total_price != null
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: garment.currency || 'EUR' }).format(garment.total_price)
    : '—'
  const formattedEta = garment.delivery_eta
    ? new Date(garment.delivery_eta).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const resolvedBackHref = backHref ?? `/dashboard/clienti/${client.id}`
  const resolvedBackLabel = backLabel ?? `${client.first_name} ${client.last_name}`

  return (
    <div className={className ?? 'max-w-2xl mx-auto px-6 py-8 space-y-6'}>

      {/* Header */}
      <div className="space-y-2">
        <Link
          href={resolvedBackHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {resolvedBackLabel}
        </Link>
        <h1 className="font-heading text-4xl text-ink leading-tight">{garmentTitle}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {client.first_name} {client.last_name}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: meta.dot }}
            />
            <span className="text-sm text-muted-foreground">{meta.label}</span>
          </div>
        </div>
      </div>

      {/* Stato produzione */}
      <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Stato produzione</p>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: meta.dot }}
            />
            <span className="text-sm font-medium text-foreground">{meta.label}</span>
          </div>
          {meta.next && (
            <button
              onClick={() => advanceStatus(meta.next!)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {meta.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pagamento */}
      <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Pagamento</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Prezzo</span>
            <span className="text-sm font-medium text-foreground tabular-nums">{formattedPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Modalità</span>
            <span className="text-sm text-foreground">
              {garment.payment_mode ? (PAYMENT_MODE_LABEL[garment.payment_mode] ?? garment.payment_mode) : '—'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground pt-2">Stato pagamento</span>
            <div className="flex rounded-sm overflow-hidden border border-border">
              {PAYMENT_STATUS_OPTIONS.map((opt) => {
                const isActive = optimisticPaymentStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => changePaymentStatus(opt.value)}
                    className="px-3 py-1.5 text-[11px] font-medium transition-colors border-r border-border last:border-r-0"
                    style={isActive ? paymentStatusActiveStyle(opt.value) : undefined}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Consegna */}
      <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Consegna</p>
        </div>
        <div className="px-6 py-5">
          {editingEta ? (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={etaValue}
                onChange={(e) => setEtaValue(e.target.value)}
                className="rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={saveEta}
                disabled={etaSaving}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" /> Modifica
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note interne */}
      <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Note interne</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }}
            rows={4}
            placeholder="Aggiungi note per uso interno…"
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground transition-opacity" style={{ opacity: notesSaved ? 1 : 0 }}>
              Salvato
            </span>
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              {notesSaving ? 'Salvo…' : 'Salva note'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
