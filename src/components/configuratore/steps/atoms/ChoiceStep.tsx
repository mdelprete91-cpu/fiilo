'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { StepFrame } from './StepFrame'

export interface ChoiceOption<T extends string | number> {
  value: T
  label: string
  description?: string
  /** Optional inline icon (lucide component) shown before the label. */
  icon?: React.ComponentType<{ className?: string }>
}

interface ChoiceStepProps<T extends string | number> {
  question: string
  description?: string
  options: ChoiceOption<T>[]
  value: T | null
  /** Called after the visual confirmation delay. The caller usually advances. */
  onChoice: (value: T) => void
  /**
   * Layout: "list" (vertical, ~400px wide) for 2–4 choices; "grid" for 6–8.
   * Default heuristic is in the component.
   */
  layout?: 'list' | 'grid'
  /** Delay between click and onChoice, in ms. Defaults to 220. */
  advanceDelay?: number
}

export function ChoiceStep<T extends string | number>({
  question,
  description,
  options,
  value,
  onChoice,
  layout,
  advanceDelay = 220,
}: ChoiceStepProps<T>) {
  const [pending, setPending] = useState<T | null>(null)
  const effective = pending ?? value
  const auto = layout ?? (options.length <= 4 ? 'list' : 'grid')

  const select = (v: T) => {
    if (pending !== null) return
    setPending(v)
    window.setTimeout(() => {
      onChoice(v)
      setPending(null)
    }, advanceDelay)
  }

  return (
    <StepFrame question={question} description={description}>
      <ul
        className={cn(
          auto === 'list'
            ? 'mx-auto flex max-w-md flex-col gap-2'
            : 'grid grid-cols-2 gap-3 md:grid-cols-3',
        )}
      >
        {options.map((opt, i) => {
          const selected = effective === opt.value
          const Icon = opt.icon
          return (
            <li key={String(opt.value)}>
              <button
                type="button"
                onClick={() => select(opt.value)}
                aria-pressed={selected}
                className={cn(
                  'group/choice relative flex w-full items-start gap-3 rounded-md border bg-card px-4 py-3 text-left transition-all',
                  'hover:border-primary/40 hover:bg-muted/30',
                  selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground',
                  )}
                  aria-hidden
                >
                  {selected ? <Check className="size-3.5" /> : i + 1}
                </span>
                {Icon && <Icon className="mt-0.5 size-5 shrink-0 text-foreground" />}
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </StepFrame>
  )
}
