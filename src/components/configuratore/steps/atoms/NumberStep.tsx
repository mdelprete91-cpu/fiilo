'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StepFrame } from './StepFrame'

interface NumberStepProps {
  question: string
  description?: string
  value: number | null
  onChange: (value: number | null) => void
  onConfirm: () => void
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  confirmLabel?: string
}

/**
 * Numeric atomic step. Enter or the confirm button advances.
 */
export function NumberStep({
  question,
  description,
  value,
  onChange,
  onConfirm,
  min,
  max,
  step,
  unit,
  placeholder,
  confirmLabel = 'Avanti',
}: NumberStepProps) {
  const valid = value !== null && !Number.isNaN(value) &&
    (min === undefined || value >= min) &&
    (max === undefined || value <= max)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (valid) onConfirm()
  }

  return (
    <StepFrame question={question} description={description}>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col items-center gap-4">
        <div className="flex w-full items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            autoFocus
            min={min}
            max={max}
            step={step}
            value={value ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onChange(v === '' ? null : Number(v))
            }}
            placeholder={placeholder}
            className="text-center text-2xl"
          />
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        <Button type="submit" size="lg" disabled={!valid}>
          {confirmLabel}
        </Button>
      </form>
    </StepFrame>
  )
}
