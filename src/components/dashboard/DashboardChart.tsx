'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ClientRecord { created_at: string }
interface GarmentRecord { created_at: string; status: string; delivery_eta: string | null }

interface Props {
  clients: ClientRecord[]
  garments: GarmentRecord[]
}

const PERIODS = [
  { id: '1m',  label: '1 mese',  months: 1  },
  { id: '6m',  label: '6 mesi',  months: 6  },
  { id: '12m', label: '1 anno',  months: 12 },
] as const

type PeriodId = (typeof PERIODS)[number]['id']

interface DataPoint {
  month: string
  clienti: number
  commissioni: number
  consegnati: number
}

function buildData(
  clients: ClientRecord[],
  garments: GarmentRecord[],
  months: number,
): DataPoint[] {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = d.toLocaleDateString('it-IT', { month: 'short' })

    return {
      month: label.charAt(0).toUpperCase() + label.slice(1),
      clienti: clients.filter(c => {
        const cd = new Date(c.created_at)
        return cd.getFullYear() === y && cd.getMonth() === m
      }).length,
      commissioni: garments.filter(g => {
        const gd = new Date(g.created_at)
        return gd.getFullYear() === y && gd.getMonth() === m
      }).length,
      consegnati: garments.filter(g => {
        if (g.status !== 'delivered' || !g.delivery_eta) return false
        const dd = new Date(g.delivery_eta)
        return dd.getFullYear() === y && dd.getMonth() === m
      }).length,
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={String(entry.dataKey)} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}</span>
          <span className="ml-auto pl-4 font-semibold text-foreground tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardChart({ clients, garments }: Props) {
  const [period, setPeriod] = useState<PeriodId>('6m')
  const months = PERIODS.find(p => p.id === period)!.months
  const data = buildData(clients, garments, months)

  const totClienti     = data.reduce((s, d) => s + d.clienti, 0)
  const totCommissioni = data.reduce((s, d) => s + d.commissioni, 0)
  const totConsegnati  = data.reduce((s, d) => s + d.consegnati, 0)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
      {/* KPI header + period selector */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5 pb-5 border-b border-border">
        <div className="flex gap-7 sm:gap-10">
          <KPIItem key={`${period}-c`} label="Clienti"     value={totClienti}     color="#2D5A3D" />
          <KPIItem key={`${period}-m`} label="Commissioni" value={totCommissioni} color="#C8712A" />
          <KPIItem key={`${period}-d`} label="Consegnati"  value={totConsegnati}  color="#1E3E62" />
        </div>

        {/* Period selector — pill group */}
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5 self-start">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-150 will-change-transform active:scale-[0.97] ${
                period === p.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — key resets Recharts internal animation state on period change */}
      <div key={period} className="h-52 px-2 pt-4 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: -28, bottom: 0 }} barCategoryGap="30%" barGap={3}>
            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke="currentColor"
              strokeOpacity={0.06}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45, fontFamily: 'system-ui' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45, fontFamily: 'system-ui' }}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              content={CustomTooltip}
              cursor={{ fill: 'var(--color-muted)', opacity: 0.7 }}
            />

            <Bar
              dataKey="clienti" name="Clienti" fill="#2D5A3D" radius={[2, 2, 0, 0]}
              isAnimationActive animationDuration={380} animationEasing="ease-out" animationBegin={0}
            />
            <Bar
              dataKey="commissioni" name="Commissioni" fill="#C8712A" radius={[2, 2, 0, 0]}
              isAnimationActive animationDuration={380} animationEasing="ease-out" animationBegin={70}
            />
            <Bar
              dataKey="consegnati" name="Consegnati" fill="#1E3E62" radius={[2, 2, 0, 0]}
              isAnimationActive animationDuration={380} animationEasing="ease-out" animationBegin={140}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

function KPIItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      </div>
      <p className="animate-fade-up will-change-[opacity,transform] font-heading text-4xl text-ink tabular-nums leading-none">
        {value}
      </p>
    </div>
  )
}

