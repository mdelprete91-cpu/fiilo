'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StepFrame } from './StepFrame'

interface TextStepProps {
  question: string
  description?: string
  value: string | null
  onChange: (value: string | null) => void
  onConfirm: () => void
  placeholder?: string
  maxLength?: number
  required?: boolean
  confirmLabel?: string
}

/**
 * Single-line text atomic step. Enter advances when valid.
 */
export function TextStep({
  question,
  description,
  value,
  onChange,
  onConfirm,
  placeholder,
  maxLength,
  required = false,
  confirmLabel = 'Avanti',
}: TextStepProps) {
  const trimmed = (value ?? '').trim()
  const valid = required ? trimmed.length > 0 : true

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (valid) onConfirm()
  }

  return (
    <StepFrame question={question} description={description}>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col items-center gap-4">
        <Input
          autoFocus
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="text-center text-lg"
        />
        <Button type="submit" size="lg" disabled={!valid}>
          {confirmLabel}
        </Button>
      </form>
    </StepFrame>
  )
}
