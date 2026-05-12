'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type Period = 'mese' | 'trimestre' | 'anno'

export interface PanoramicaGarment {
  id: string
  name: string | null
  type: string
  status: string
  total_price: number | null
  currency: string
  delivery_eta: string | null
  updated_at: string
  created_at: string
  client_id: string
  clientName: string
  payment_mode: string | null
  payment_status: string | null
  deposit_amount: number | null
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'mese',      label: 'Mese' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'anno',      label: 'Anno' },
]

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Giacca',
  trousers: 'Pantalone', waistcoat: 'Gilet', coat: 'Soprabito',
  tuxedo: 'Smoking', shirt: 'Camicia',
}

const C_INCASSATO    = '#1E5433'
const C_DA_INCASSARE = '#C8712A'

/* Pipeline status colors */
const DOT_CONFERMATI   = 'oklch(0.58 0.15 225)'  /* azzurro */
const DOT_LAVORAZIONE  = 'oklch(0.58 0.14 55)'   /* arancione */
const DOT_PRONTI       = 'oklch(0.40 0.10 155)'  /* verde */

function periodStart(period: Period): Date {
  const now = new Date()
  if (period === 'mese')      return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'trimestre') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  return new Date(now.getFullYear(), 0, 1)
}

function periodLabel(period: Period): string {
  if (period === 'mese')      return 'nel mese'
  if (period === 'trimestre') return 'nel trimestre'
  return "nell'anno"
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount)
}

function fmtK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`
  return String(Math.round(v))
}

function collectAmount(g: PanoramicaGarment): number {
  const s = g.payment_status ?? 'pending'
  if (s === 'paid')    return g.total_price ?? 0
  if (s === 'partial') return g.deposit_amount ?? 0
  return 0
}

interface ChartPoint { label: string; incassato: number; da_incassare: number }

function buildChartData(garments: PanoramicaGarment[], period: Period): ChartPoint[] {
  const now    = new Date()
  const active = garments.filter(g => !['draft', 'cancelled'].includes(g.status))

  function slot(start: Date, end: Date, label: string): ChartPoint {
    const items     = active.filter(g => { const d = new Date(g.created_at); return d >= start && d <= end })
    const incassato = items.reduce((s, g) => s + collectAmount(g), 0)
    const fatturato = items.reduce((s, g) => s + (g.total_price ?? 0), 0)
    return { label, incassato, da_incassare: Math.max(0, fatturato - incassato) }
  }

  if (period === 'mese') {
    const y = now.getFullYear(), m = now.getMonth()
    const last = new Date(y, m + 1, 0).getDate()
    return [
      slot(new Date(y, m,  1), new Date(y, m,  7, 23, 59, 59), '1'),
      slot(new Date(y, m,  8), new Date(y, m, 14, 23, 59, 59), '8'),
      slot(new Date(y, m, 15), new Date(y, m, 21, 23, 59, 59), '15'),
      slot(new Date(y, m, 22), new Date(y, m, last, 23, 59, 59), '22'),
    ]
  }

  if (period === 'trimestre') {
    const qs = Math.floor(now.getMonth() / 3) * 3
    return Array.from({ length: 3 }, (_, i) => {
      const mo  = qs + i
      const lbl = new Date(now.getFullYear(), mo, 1).toLocaleDateString('it-IT', { month: 'short' })
      return slot(
        new Date(now.getFullYear(), mo, 1),
        new Date(now.getFullYear(), mo + 1, 0, 23, 59, 59),
        lbl.charAt(0).toUpperCase() + lbl.slice(1),
      )
    })
  }

  return Array.from({ length: 12 }, (_, i) => {
    const lbl = new Date(now.getFullYear(), i, 1).toLocaleDateString('it-IT', { month: 'short' })
    return slot(
      new Date(now.getFullYear(), i, 1),
      new Date(now.getFullYear(), i + 1, 0, 23, 59, 59),
      lbl.charAt(0).toUpperCase() + lbl.slice(1),
    )
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inc: number = payload.find((p: any) => p.dataKey === 'incassato')?.value ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const due: number = payload.find((p: any) => p.dataKey === 'da_incassare')?.value ?? 0
  if (inc + due === 0) return null
  return (
    <div className="rounded border border-border bg-card px-3 py-2.5 shadow-md text-xs">
      <p className="font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-8">
          <span className="text-muted-foreground">Fatturato</span>
          <span className="font-semibold tabular-nums text-foreground">{fmt(inc + due)}</span>
        </div>
        {inc > 0 && (
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C_INCASSATO }} />
              Incassato
            </span>
            <span className="font-semibold tabular-nums text-foreground">{fmt(inc)}</span>
          </div>
        )}
        {due > 0 && (
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: C_DA_INCASSARE }} />
              Da incassare
            </span>
            <span className="font-semibold tabular-nums text-foreground">{fmt(due)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function PanoramicaView({ garments }: { garments: PanoramicaGarment[] }) {
  const [period, setPeriod] = useState<Period>('mese')

  const { kpis, chartData } = useMemo(() => {
    const from         = periodStart(period)
    const active       = garments.filter(g => !['draft', 'cancelled'].includes(g.status))
    const periodActive = active.filter(g => new Date(g.created_at) >= from)

    const fatturato   = periodActive.reduce((s, g) => s + (g.total_price ?? 0), 0)
    const incassato   = periodActive.reduce((s, g) => s + collectAmount(g), 0)
    const daIncassare = Math.max(0, fatturato - incassato)

    const consegnatiPeriodo = garments.filter(
      g => g.status === 'delivered' && new Date(g.updated_at) >= from,
    )

    const prossime = [...garments.filter(g => g.status === 'ready' && g.delivery_eta)]
      .sort((a, b) => new Date(a.delivery_eta!).getTime() - new Date(b.delivery_eta!).getTime())
      .slice(0, 8)

    return {
      kpis: {
        fatturato, incassato, daIncassare,
        consegnatiCount: consegnatiPeriodo.length,
        confermati:      garments.filter(g => g.status === 'confirmed').length,
        inProduzione:    garments.filter(g => g.status === 'in_production').length,
        pronti:          garments.filter(g => g.status === 'ready').length,
        hasPrices:       periodActive.some(g => (g.total_price ?? 0) > 0),
        prossime,
      },
      chartData: buildChartData(garments, period),
    }
  }, [garments, period])

  return (
    /* Full-height flex column — period selector shrinks, grid grows */
    <div className="h-full flex flex-col gap-5">

      {/* Period selector */}
      <div className="shrink-0 flex items-center gap-0.5 rounded-full bg-muted p-0.5 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 text-[11px] font-semibold rounded-full transition-all duration-150 active:scale-[0.97] will-change-transform ${
              period === p.value
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Two-column grid — fills remaining height */}
      <div className="flex-1 min-h-0 grid gap-5 lg:grid-cols-5">

        {/* ── Card sinistra: Produzione ── */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-card">

          {/* Card header — titolo + link */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Produzione
            </p>
            <Link
              href="/dashboard/produzione"
              className="text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              Vai alla produzione →
            </Link>
          </div>

          {/* Consegnati — stesso livello gerarchico dei KPI finanziari */}
          <div className="shrink-0 px-6 py-5 border-b border-border">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-2.5">
              Consegnati
            </p>
            <p className="font-heading text-4xl leading-none tabular-nums text-ink">
              {kpis.consegnatiCount}
            </p>
            <p className="mt-1.5 text-[10px] text-muted-foreground/60">
              abiti {periodLabel(period)}
            </p>
          </div>

          {/* Pipeline — stati secondari con dot colorati */}
          <div className="shrink-0 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DOT_CONFERMATI }} />
                <span className="font-semibold text-foreground tabular-nums">{kpis.confermati}</span>
                <span className="text-muted-foreground">Confermati</span>
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DOT_LAVORAZIONE }} />
                <span className="font-semibold text-foreground tabular-nums">{kpis.inProduzione}</span>
                <span className="text-muted-foreground">In lavorazione</span>
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DOT_PRONTI }} />
                <span className="font-semibold text-foreground tabular-nums">{kpis.pronti}</span>
                <span className="text-muted-foreground">Pronti</span>
              </span>
            </div>
          </div>

          {/* Pronti da consegnare — lista scrollabile */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {kpis.prossime.length > 0 ? (
              <>
                <div className="px-6 py-3 border-b border-border bg-muted/50">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Pronti da consegnare
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {kpis.prossime.map((g) => {
                    const days =
                      g.delivery_eta != null
                        ? Math.ceil((new Date(g.delivery_eta).getTime() - Date.now()) / 86_400_000)
                        : null
                    const daysClass =
                      days == null ? 'text-muted-foreground'
                        : days < 0  ? 'text-destructive'
                        : days <= 3 ? 'text-destructive'
                        : days <= 7 ? 'text-amber-600'
                        : 'text-muted-foreground'

                    return (
                      <li
                        key={g.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/clienti/${g.client_id}/abiti/${g.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {g.name ?? TYPE_LABEL[g.type] ?? g.type}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{g.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {g.total_price != null && (
                            <span className="text-sm font-semibold text-ink tabular-nums">
                              {fmt(g.total_price, g.currency)}
                            </span>
                          )}
                          {days !== null && (
                            <span
                              className={`text-xs font-semibold tabular-nums ${daysClass}`}
                              title={
                                days < 0
                                  ? `Doveva essere consegnato ${Math.abs(days)} giorn${Math.abs(days) === 1 ? 'o' : 'i'} fa`
                                  : days === 0
                                    ? 'Consegna prevista oggi'
                                    : `Consegna tra ${days} giorn${days === 1 ? 'o' : 'i'}`
                              }
                            >
                              {days < 0
                                ? `${Math.abs(days)}g fa`
                                : days === 0
                                  ? 'Oggi'
                                  : `tra ${days}g`}
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <div className="px-6 py-5">
                <p className="text-xs text-muted-foreground">Nessun abito pronto da consegnare.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Card destra: Andamento ── */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-card">

          {/* Card header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Andamento
            </p>
            <div className="flex items-center gap-5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: C_INCASSATO }} />
                Incassato
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: C_DA_INCASSARE }} />
                Da incassare
              </span>
            </div>
          </div>

          {/* KPI finanziari */}
          <div className="shrink-0 grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-2.5">
                Fatturato
              </p>
              <p className="font-heading text-4xl leading-none tabular-nums"
                 style={{ color: 'var(--kpi-fatturato)' }}>
                {kpis.hasPrices ? fmt(kpis.fatturato) : '—'}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">{periodLabel(period)}</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-2.5">
                Incassato
              </p>
              <p className="font-heading text-4xl leading-none tabular-nums"
                 style={{ color: 'var(--kpi-incassato)' }}>
                {kpis.hasPrices ? fmt(kpis.incassato) : '—'}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">{periodLabel(period)}</p>
            </div>

            <div className="px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 mb-2.5">
                Da incassare
              </p>
              <p className="font-heading text-4xl leading-none tabular-nums"
                 style={{ color: 'var(--kpi-due)' }}>
                {kpis.hasPrices ? fmt(kpis.daIncassare) : '—'}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">saldo residuo</p>
            </div>
          </div>

          {/* Grafico — flex-1 riempie fino in fondo */}
          <div key={period} className="flex-1 min-h-0 px-2 pt-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
                barCategoryGap="38%"
              >
                <CartesianGrid
                  strokeDasharray="0"
                  vertical={false}
                  stroke="currentColor"
                  strokeOpacity={0.06}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  tickFormatter={fmtK}
                  width={40}
                />
                <Tooltip
                  content={ChartTooltip}
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                />
                <Bar
                  dataKey="incassato" name="Incassato" stackId="a"
                  fill={C_INCASSATO} radius={[0, 0, 2, 2]}
                  isAnimationActive animationDuration={350} animationEasing="ease-out" animationBegin={0}
                />
                <Bar
                  dataKey="da_incassare" name="Da incassare" stackId="a"
                  fill={C_DA_INCASSARE} radius={[2, 2, 0, 0]}
                  isAnimationActive animationDuration={350} animationEasing="ease-out" animationBegin={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
