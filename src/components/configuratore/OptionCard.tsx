'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  className?: string
}

export function OptionCard({ label, description, selected, onClick, className }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150 will-change-transform active:scale-[0.98]',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
        className,
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-scale-in">
          <Check className="h-3 w-3" />
        </span>
      )}
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && <span className="mt-0.5 text-xs text-muted-foreground">{description}</span>}
    </button>
  )
}

interface StepHeaderProps {
  title: string
  subtitle?: string
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

interface SectionProps {
  label: string
  children: React.ReactNode
}

export function Section({ label, children }: SectionProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-4 py-3', disabled && 'opacity-40 cursor-not-allowed')}>
      <div className="mt-0.5 shrink-0">
        <div
          onClick={() => { if (!disabled) onChange(!checked) }}
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  )
}
