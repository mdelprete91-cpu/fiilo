import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ label, value, trend, className }: StatCardProps) {
  return (
    <div className={cn('flex flex-col justify-between p-5 lg:p-6', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3">
        <p className="text-3xl font-bold tracking-tight text-ink tabular-nums leading-none">
          {value}
        </p>
        {trend && (
          <p className={cn(
            'mt-1.5 text-[11px] font-medium',
            trend.value >= 0 ? 'text-emerald-600' : 'text-destructive'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
