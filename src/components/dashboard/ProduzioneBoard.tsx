'use client'

import { useOptimistic, useTransition, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { updateGarmentStatusAction, updateGarmentAssigneeAction, updateGarmentDetailsAction } from '@/lib/actions/garments'

export interface GarmentRow {
  id: string
  name: string | null
  type: string
  status: string
  delivery_eta: string | null
  client_id: string
  clientName: string
  internal_notes: string | null
  assigned_to: string | null
  assigneeName: string | null
  needs_materials: boolean
  total_price: number | null
  deposit_amount: number | null
  payment_status: string | null
}

interface StaffMember {
  id: string
  name: string
}

interface Props {
  garments: GarmentRow[]
  staffList: StaffMember[]
}

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Giacca',
  trousers: 'Pantalone', waistcoat: 'Gilet', coat: 'Soprabito',
  tuxedo: 'Smoking', shirt: 'Camicia',
}

const STATUS_META: Record<string, { label: string; dot: string; next: string | null }> = {
  confirmed:     { label: 'Richiesti',      dot: 'oklch(0.58 0.15 225)',         next: 'in_production' },
  in_production: { label: 'In lavorazione', dot: 'oklch(0.58 0.13 55)',          next: 'ready' },
  ready:         { label: 'Pronti',         dot: 'oklch(0.40 0.10 155)',         next: 'delivered' },
  delivered:     { label: 'Consegnati',     dot: 'oklch(0.55 0.005 80 / 0.35)', next: null },
}

const PIPELINE_COLUMNS = ['confirmed', 'in_production', 'ready', 'delivered'] as const
const MAX_DELIVERED = 10

function formatCurrency(value: number): string {
  const n = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
  return `€ ${n}`
}

function formatEta(eta: string): string {
  const d = new Date(eta)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  if (parts.length >= 2) return (first.charAt(0) + last.charAt(0)).toUpperCase()
  return first.slice(0, 2).toUpperCase()
}

export function ProduzioneBoard({ garments: initial, staffList }: Props) {
  const [, startTransition] = useTransition()
  const [garments, setOptimistic] = useOptimistic(initial)
  const [activeGarment, setActiveGarment] = useState<GarmentRow | null>(null)
  const [priceModal, setPriceModal] = useState<GarmentRow | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function advanceStatus(garmentId: string, nextStatus: string) {
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((g) => (g.id === garmentId ? { ...g, status: nextStatus } : g))
      )
      await updateGarmentStatusAction(garmentId, nextStatus)
    })
  }

  function handleDragStart({ active }: DragStartEvent) {
    const g = garments.find((g) => g.id === active.id)
    setActiveGarment(g ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveGarment(null)
    if (!over) return

    const targetStatus = over.id as string
    const garment = garments.find((g) => g.id === active.id)
    if (!garment || garment.status === targetStatus) return

    const order = ['confirmed', 'in_production', 'ready', 'delivered']
    const from = order.indexOf(garment.status)
    const to = order.indexOf(targetStatus)
    if (to <= from) return

    advanceStatus(garment.id, targetStatus)
  }

  function handleEditPrice(g: GarmentRow) {
    setPriceModal(g)
  }

  function handleSavePrice(garmentId: string, data: {
    total_price: number | null
    deposit_amount: number | null
    payment_status: 'pending' | 'partial' | 'paid'
  }) {
    setPriceModal(null)
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((g) => g.id === garmentId ? { ...g, ...data } : g)
      )
      await updateGarmentDetailsAction(garmentId, data)
    })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 items-start">
        {PIPELINE_COLUMNS.map((status) => {
          const meta = STATUS_META[status]!
          let col = garments.filter((g) => g.status === status)

          if (status === 'delivered') {
            col = col
              .filter((g) => g.delivery_eta)
              .sort((a, b) => new Date(b.delivery_eta!).getTime() - new Date(a.delivery_eta!).getTime())
              .concat(col.filter((g) => !g.delivery_eta))
          } else {
            col = col
              .filter((g) => g.delivery_eta)
              .sort((a, b) => new Date(a.delivery_eta!).getTime() - new Date(b.delivery_eta!).getTime())
              .concat(col.filter((g) => !g.delivery_eta))
          }

          const totalDelivered = status === 'delivered' ? col.length : 0
          const visible = status === 'delivered' ? col.slice(0, MAX_DELIVERED) : col

          return (
            <Column
              key={status}
              status={status}
              meta={meta}
              garments={visible}
              totalDelivered={totalDelivered}
              isDragging={!!activeGarment}
              staffList={staffList}
              onEditPrice={handleEditPrice}
            />
          )
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 140, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeGarment ? <CardOverlay garment={activeGarment} /> : null}
      </DragOverlay>

      {priceModal && (
        <PriceModal
          garment={priceModal}
          onClose={() => setPriceModal(null)}
          onSave={handleSavePrice}
        />
      )}
    </DndContext>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

function Column({
  status, meta, garments, totalDelivered, isDragging, staffList, onEditPrice,
}: {
  status: string
  meta: typeof STATUS_META[string]
  garments: GarmentRow[]
  totalDelivered: number
  isDragging: boolean
  staffList: StaffMember[]
  onEditPrice: (g: GarmentRow) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl border bg-card"
      style={{
        borderColor: isOver && isDragging ? 'oklch(0.28 0.07 155)' : 'var(--color-border)',
        backgroundColor: isOver && isDragging ? 'oklch(0.93 0.05 155 / 0.07)' : undefined,
        transition: 'border-color 140ms ease-out, background-color 140ms ease-out',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {meta.label}
          </h3>
        </div>
        <span className="font-heading text-lg text-ink leading-none tabular-nums">{garments.length}</span>
      </div>

      <ul className="divide-y divide-border">
        {garments.map((g) => (
          <GarmentCard key={g.id} garment={g} staffList={staffList} onEditPrice={onEditPrice} />
        ))}
        {garments.length === 0 && (
          <li
            className="px-4 py-8 text-center text-xs"
            style={{
              color: isOver && isDragging ? 'oklch(0.28 0.07 155)' : 'oklch(0.65 0.01 85 / 0.45)',
              transition: 'color 140ms ease-out',
            }}
          >
            {isOver && isDragging ? 'Rilascia qui' : 'Nessun abito'}
          </li>
        )}
        {status === 'delivered' && totalDelivered > MAX_DELIVERED && (
          <li className="px-4 py-3 text-center">
            <Link
              href="/dashboard/clienti"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              + {totalDelivered - MAX_DELIVERED} altri — Vedi clienti
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}

// ── Draggable card ─────────────────────────────────────────────────────────────
//
// Click vs drag disambiguation: dnd-kit's PointerSensor with distance:6 only
// activates drag after 6px of movement. A clean tap never reaches that threshold,
// so the browser fires the click event normally and router.push navigates.
// After a real drag (6px+ movement), the browser suppresses the click event —
// no ghost navigation. The li covers the full hit area so any tap navigates.
//
// Hover flicker fix: the li's position never changes (stable cursor target).
// The inner div lifts visually via group-hover, so the cursor can't "leave"
// a moving parent and cause flicker.

function GarmentCard({ garment: g, staffList, onEditPrice }: { garment: GarmentRow; staffList: StaffMember[]; onEditPrice: (g: GarmentRow) => void }) {
  const router = useRouter()
  const isDelivered = g.status === 'delivered'
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: g.id })
  const hasNotes = Boolean(g.internal_notes?.trim())

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/dashboard/produzione/${g.id}`)}
      className="group relative cursor-grab active:cursor-grabbing touch-none select-none"
      style={{
        opacity: isDragging ? 0 : isDelivered ? 0.5 : 1,
        transition: 'background-color 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 14px -2px oklch(0 0 0 / 0.09), 0 1px 4px oklch(0 0 0 / 0.05)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.zIndex = '2'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.transform = ''
        e.currentTarget.style.zIndex = ''
      }}
    >
      <div className="p-4 space-y-1.5 motion-reduce:transition-none">
        {/* Nome + cliente + indicatori */}
        <div className="flex items-start gap-2">
          <span className="mt-[3px] shrink-0 text-muted-foreground/22 group-hover:text-muted-foreground/55 transition-colors duration-180" aria-hidden>
            <GripIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-tight">
                {g.name ?? TYPE_LABEL[g.type] ?? g.type}
              </p>
              {(g.needs_materials || hasNotes) && (
                <span className="flex items-center gap-1 shrink-0 mt-1">
                  {g.needs_materials && (
                    <span
                      title="Materiali mancanti"
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: 'oklch(0.72 0.15 60)' }}
                      aria-label="Materiali mancanti"
                    />
                  )}
                  {hasNotes && (
                    <span
                      title="Note interne"
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: 'oklch(0.55 0.005 85 / 0.55)' }}
                      aria-label="Note interne"
                    />
                  )}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{g.clientName}</p>
          </div>
        </div>

        {/* Bollino assegnatario — allineato con l'inizio del testo titolo */}
        {!isDelivered && (
          <div className="pl-[18px]">
            <AssigneePicker
              garmentId={g.id}
              assignedTo={g.assigned_to}
              assigneeName={g.assigneeName}
              staffList={staffList}
            />
          </div>
        )}

        {/* Prezzo · data di consegna */}
        <div className="pl-[18px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditPrice(g) }}
              className="flex items-baseline gap-1.5 flex-wrap text-left hover:opacity-60 transition-opacity duration-150"
              title="Modifica pagamento"
            >
              {g.total_price != null ? (
                <>
                  <span className="text-[11px] tabular-nums font-semibold text-foreground/80 shrink-0">
                    {formatCurrency(g.total_price)}
                  </span>
                  {g.payment_status === 'paid' && (
                    <span
                      className="text-[11px] font-semibold shrink-0"
                      style={{ color: 'oklch(0.55 0.15 155)' }}
                    >
                      Saldato
                    </span>
                  )}
                  {g.payment_status !== 'paid' && g.deposit_amount != null && g.deposit_amount > 0 && (
                    <span
                      className="text-[11px] tabular-nums font-semibold shrink-0"
                      style={{ color: 'oklch(0.55 0.15 155)' }}
                    >
                      acc. {formatCurrency(g.deposit_amount)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors">
                  + prezzo
                </span>
              )}
            </button>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] leading-none font-semibold uppercase tracking-[0.15em] text-muted-foreground/35 mb-0.5">
              Consegna
            </p>
            <p className="text-[11px] font-mono tabular-nums text-muted-foreground/60">
              {g.delivery_eta ? formatEta(g.delivery_eta) : '—'}
            </p>
          </div>
        </div>
      </div>
    </li>
  )
}

// ── Assignee picker ────────────────────────────────────────────────────────────
//
// The column has overflow-hidden (needed for rounded-corner clipping). The
// dropdown must escape it, so we portal it into document.body and use
// position:fixed with coordinates from getBoundingClientRect().

function AssigneePicker({
  garmentId,
  assignedTo,
  assigneeName,
  staffList,
}: {
  garmentId: string
  assignedTo: string | null
  assigneeName: string | null
  staffList: StaffMember[]
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // estimate dropdown height: 1 unassigned + staffList rows × 32px + 8px padding
    const estimatedHeight = (staffList.length + 1) * 32 + 8
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight
    setPos({
      top: openUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
      left: rect.left,
      openUp,
    })
    setOpen((o) => !o)
  }

  function handleSelect(e: React.MouseEvent, staffId: string | null) {
    e.stopPropagation()
    setOpen(false)
    startTransition(async () => {
      await updateGarmentAssigneeAction(garmentId, staffId)
    })
  }

  const isAssigned = Boolean(assignedTo && assigneeName)

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        title={isAssigned ? assigneeName! : 'Assegna'}
        className={`h-5 w-5 rounded-full flex items-center justify-center leading-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
          isAssigned
            ? 'bg-ink text-background text-[9px] font-bold hover:opacity-70'
            : 'border border-dashed border-muted-foreground/30 text-muted-foreground/35 text-[11px] font-light hover:border-muted-foreground/50 hover:text-muted-foreground/55'
        }`}
        aria-label={isAssigned ? `Assegnato a ${assigneeName}` : 'Assegna'}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {isAssigned ? initials(assigneeName!) : '+'}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Seleziona assegnatario"
          className="fixed z-50 min-w-[168px] rounded-xl border border-border bg-card py-1 overflow-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            boxShadow: '0 8px 24px oklch(0 0 0 / 0.10), 0 2px 6px oklch(0 0 0 / 0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Unassigned row */}
          <button
            type="button"
            role="option"
            aria-selected={!assignedTo}
            onClick={(e) => handleSelect(e, null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
              !assignedTo
                ? 'bg-muted/60 text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-[9px] text-muted-foreground/40 leading-none">
              —
            </span>
            Non assegnato
          </button>

          {/* Staff rows */}
          {staffList.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={assignedTo === s.id}
              onClick={(e) => handleSelect(e, s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                assignedTo === s.id
                  ? 'bg-muted/60 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-ink text-background flex items-center justify-center shrink-0 text-[9px] font-bold leading-none">
                {initials(s.name)}
              </span>
              {s.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Drag overlay (ghost card while dragging) ───────────────────────────────────

function CardOverlay({ garment: g }: { garment: GarmentRow }) {
  return (
    <div
      className="rounded-xl bg-card px-4 py-3.5 w-60 space-y-2.5"
      style={{
        border: '1px solid oklch(0.28 0.07 155 / 0.18)',
        boxShadow: '0 12px 28px oklch(0 0 0 / 0.12), 0 3px 8px oklch(0 0 0 / 0.06)',
        transform: 'rotate(1.5deg) scale(1.025)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-[3px] shrink-0 text-muted-foreground/30" aria-hidden>
          <GripIcon />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {g.name ?? TYPE_LABEL[g.type] ?? g.type}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{g.clientName}</p>
        </div>
      </div>
      <div className="pl-[22px]">
        <span className="text-[11px] font-mono tabular-nums text-muted-foreground/60">
          {g.delivery_eta ? `Scadenza: ${formatEta(g.delivery_eta)}` : '—'}
        </span>
      </div>
    </div>
  )
}

// ── Price modal ────────────────────────────────────────────────────────────────

function PriceModal({
  garment,
  onClose,
  onSave,
}: {
  garment: GarmentRow
  onClose: () => void
  onSave: (id: string, data: { total_price: number | null; deposit_amount: number | null; payment_status: 'pending' | 'partial' | 'paid' }) => void
}) {
  const [price, setPrice] = useState(garment.total_price != null ? String(garment.total_price) : '')
  const [deposit, setDeposit] = useState(garment.deposit_amount != null ? String(garment.deposit_amount) : '')
  const [status, setStatus] = useState<'pending' | 'partial' | 'paid'>(
    (garment.payment_status as 'pending' | 'partial' | 'paid') ?? 'pending'
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedPrice = price.trim() ? parseFloat(price.replace(',', '.')) : null
    const parsedDeposit = status === 'partial' && deposit.trim()
      ? parseFloat(deposit.replace(',', '.'))
      : null
    onSave(garment.id, { total_price: parsedPrice, deposit_amount: parsedDeposit, payment_status: status })
  }

  const parsedPrice = parseFloat(price.replace(',', '.'))
  const parsedDeposit = parseFloat(deposit.replace(',', '.'))
  const remainder = !isNaN(parsedPrice) && !isNaN(parsedDeposit) && parsedDeposit < parsedPrice
    ? parsedPrice - parsedDeposit
    : null

  const garmentLabel = garment.name ?? TYPE_LABEL[garment.type] ?? garment.type

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'oklch(0 0 0 / 0.32)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xs rounded-xl border border-border bg-card"
        style={{ boxShadow: '0 16px 48px oklch(0 0 0 / 0.13), 0 4px 12px oklch(0 0 0 / 0.07)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Pagamento
          </p>
          <p className="mt-1 text-sm font-medium text-foreground leading-tight">{garmentLabel}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{garment.clientName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Prezzo totale */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
              Prezzo totale
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none">€</span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full rounded-[2px] border border-border bg-background pl-7 pr-3 py-2 text-sm tabular-nums text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-ring/40"
              />
            </div>
          </div>

          {/* Stato pagamento */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
              Pagamento
            </label>
            <div className="grid grid-cols-3 rounded-[2px] border border-border overflow-hidden">
              {(['pending', 'partial', 'paid'] as const).map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-1.5 text-[11px] text-center transition-colors ${i > 0 ? 'border-l border-border' : ''} ${
                    status === s
                      ? 'bg-ink text-background font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {s === 'pending' ? 'Da pagare' : s === 'partial' ? 'Acconto' : 'Saldato'}
                </button>
              ))}
            </div>
          </div>

          {/* Acconto versato — solo se partial */}
          {status === 'partial' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                Acconto versato
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none">€</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-[2px] border border-border bg-background pl-7 pr-3 py-2 text-sm tabular-nums text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-ring/40"
                />
              </div>
              {remainder !== null && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  Da saldare: {formatCurrency(remainder)}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-[2px] bg-ink text-background hover:opacity-80 transition-opacity"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.5" />
      <circle cx="7.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="7" r="1.5" />
      <circle cx="7.5" cy="7" r="1.5" />
      <circle cx="2.5" cy="11.5" r="1.5" />
      <circle cx="7.5" cy="11.5" r="1.5" />
    </svg>
  )
}
