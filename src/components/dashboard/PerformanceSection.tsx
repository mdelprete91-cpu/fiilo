'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export interface GarmentStat {
  created_at: string
  status: string
  delivery_eta: string | null
}

type Period = '1m' | '6m' | '12m'

const MONTHS_IT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

const C_RICHIESTI  = 'oklch(0.35 0.07 250)'  // navy — ordini ricevuti
const C_CONSEGNATI = 'oklch(0.28 0.07 155)'  // verde foresta — lavori completati

const PERIODS: { value: Period; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '6m', label: '6m' },
  { value: '12m', label: '12m' },
]

function periodStart(period: Period): Date {
  const now = new Date()
  if (period === '1m')  return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === '6m')  return new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
}

function buildChartData(garments: GarmentStat[], period: Period) {
  const now = new Date()

  if (period === '1m') {
    // weekly buckets within the current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const weeks = Math.ceil(daysInMonth / 7)
    return Array.from({ length: weeks }, (_, i) => {
      const start = new Date(monthStart); start.setDate(1 + i * 7)
      const end   = new Date(monthStart); end.setDate(Math.min(1 + (i + 1) * 7, daysInMonth + 1))
      return {
        label: `Sett. ${i + 1}`,
        richiesti:  garments.filter(g => { const d = new Date(g.created_at);  return d >= start && d < end }).length,
        consegnati: garments.filter(g => {
          if (g.status !== 'delivered' || !g.delivery_eta) return false
          const d = new Date(g.delivery_eta); return d >= start && d < end
        }).length,
      }
    })
  }

  const months = period === '6m' ? 6 : 12
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const next  = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    return {
      label:      MONTHS_IT[month.getMonth()],
      richiesti:  garments.filter(g => { const d = new Date(g.created_at);  return d >= month && d < next }).length,
      consegnati: garments.filter(g => {
        if (g.status !== 'delivered' || !g.delivery_eta) return false
        const d = new Date(g.delivery_eta); return d >= month && d < next
      }).length,
    }
  })
}

function computeKPIs(garments: GarmentStat[], period: Period) {
  const from = periodStart(period)
  const richiesti  = garments.filter(g => new Date(g.created_at) >= from).length
  const consegnati = garments.filter(g => {
    if (g.status !== 'delivered' || !g.delivery_eta) return false
    return new Date(g.delivery_eta) >= from
  }).length
  const tasso = richiesti > 0 ? Math.round((consegnati / richiesti) * 100) : 0
  return { richiesti, consegnati, tasso }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function PerformanceSection({ garments }: { garments: GarmentStat[] }) {
  const [period, setPeriod] = useState<Period>('6m')

  const data = useMemo(() => buildChartData(garments, period), [garments, period])
  const kpis = useMemo(() => computeKPIs(garments, period), [garments, period])

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">

      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Performance produzione
        </p>
        <div className="flex items-center gap-0.5 rounded-sm bg-muted p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all duration-150 active:scale-[0.97] will-change-transform ${
                period === p.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <KpiCell key={`${period}-r`} label="Richiesti" value={kpis.richiesti} />
        <KpiCell key={`${period}-c`} label="Consegnati" value={kpis.consegnati} />
        <KpiCell key={`${period}-t`} label="Completamento" value={`${kpis.tasso}%`} />
      </div>

      {/* Chart */}
      <div key={period} className="px-6 pt-6 pb-5">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barGap={3} barCategoryGap="40%">
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeOpacity={0.8}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <Tooltip
              content={CustomTooltip}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
            />
            <Bar
              dataKey="richiesti"
              name="Richiesti"
              fill={C_RICHIESTI}
              radius={[2, 2, 0, 0]}
              isAnimationActive
              animationDuration={350}
              animationEasing="ease-out"
              animationBegin={0}
            />
            <Bar
              dataKey="consegnati"
              name="Consegnati"
              fill={C_CONSEGNATI}
              radius={[2, 2, 0, 0]}
              isAnimationActive
              animationDuration={350}
              animationEasing="ease-out"
              animationBegin={60}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <LegendDot color={C_RICHIESTI}  label="Richiesti" />
          <LegendDot color={C_CONSEGNATI} label="Consegnati" />
        </div>
      </div>
    </div>
  )
}

function KpiCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
        {label}
      </p>
      <p
        className="font-heading text-4xl text-ink leading-none tabular-nums [animation:kpi-slide-in_200ms_ease-out_both]"
      >
        {value}
      </p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
