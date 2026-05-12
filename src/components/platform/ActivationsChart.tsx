'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DayPoint {
  date: string  // ISO YYYY-MM-DD
  count: number
}

interface Props {
  points: DayPoint[]
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function ActivationsChart({ points }: Props) {
  const total = points.reduce((s, p) => s + p.count, 0)
  const last7 = points.slice(-7).reduce((s, p) => s + p.count, 0)
  const prev7 = points.slice(-14, -7).reduce((s, p) => s + p.count, 0)
  const delta = last7 - prev7

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Attivazioni · ultimi 90 giorni
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{total}</span> totali ·{' '}
          <span
            className={
              delta > 0
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : delta < 0
                  ? 'text-rose-700 dark:text-rose-400 font-medium'
                  : 'text-muted-foreground'
            }
          >
            {delta > 0 ? '+' : ''}{delta} vs 7gg prec
          </span>
        </p>
      </div>

      <div className="flex-1 min-h-[280px] p-2 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 6, left: 8 }}>
            <defs>
              <linearGradient id="activationsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickFormatter={formatDateLabel}
              interval="preserveStartEnd"
              minTickGap={48}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)', strokeDasharray: 4 }}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                padding: '8px 10px',
              }}
              labelFormatter={(label) => formatDateLabel(String(label))}
              formatter={(v) => [String(v), 'attivazioni']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={1.5}
              fill="url(#activationsFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
