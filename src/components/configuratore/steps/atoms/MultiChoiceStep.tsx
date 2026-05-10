'use client'

import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StepFrame } from './StepFrame'

export interface MultiChoiceOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface MultiChoiceStepProps<T extends string> {
  question: string
  description?: string
  options: MultiChoiceOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  /** Called when the user confirms the selection. */
  onConfirm: () => void
  /** Allow zero selections to confirm. Defaults to true. */
  allowEmpty?: boolean
  confirmLabel?: string
}

/**
 * Multi-select atomic step. Selections accumulate; user confirms with the
 * primary action button (no auto-advance).
 */
export function MultiChoiceStep<T extends string>({
  question,
  description,
  options,
  value,
  onChange,
  onConfirm,
  allowEmpty = true,
  confirmLabel = 'Avanti',
}: MultiChoiceStepProps<T>) {
  const toggle = (v: T) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }
  const canConfirm = allowEmpty || value.length > 0

  return (
    <StepFrame question={question} description={description}>
      <ul className="mx-auto flex max-w-md flex-col gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => toggle(opt.value)}
                aria-pressed={selected}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border bg-card px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30',
                  selected ? 'border-primary bg-primary/5' : 'border-border',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background',
                  )}
                  aria-hidden
                >
                  {selected && <Check className="size-3.5" />}
                </span>
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
      <div className="mt-6 flex justify-center">
        <Button onClick={onConfirm} disabled={!canConfirm} size="lg">
          {confirmLabel}
        </Button>
      </div>
    </StepFrame>
  )
}
