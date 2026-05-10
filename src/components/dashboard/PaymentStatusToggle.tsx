'use client'

import { useState, useTransition } from 'react'
import { updatePaymentStatusAction } from '@/lib/actions/garments'

type PaymentStatus = 'pending' | 'partial' | 'paid'

interface Props {
  garmentId: string
  initialStatus: string
}

const BUTTONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'In attesa' },
  { value: 'partial', label: 'Acconto' },
  { value: 'paid', label: 'Saldato' },
]

const ACTIVE_STYLES: Record<PaymentStatus, React.CSSProperties> = {
  pending: { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.45 0.02 85)' },
  partial: { background: 'oklch(0.96 0.06 30)', color: 'oklch(0.50 0.10 30)' },
  paid:    { background: 'oklch(0.93 0.05 155)', color: 'oklch(0.28 0.07 155)' },
}

export function PaymentStatusToggle({ garmentId, initialStatus }: Props) {
  const [status, setStatus] = useState<PaymentStatus>(
    (initialStatus as PaymentStatus) ?? 'pending',
  )
  const [isPending, startTransition] = useTransition()

  function handleClick(next: PaymentStatus) {
    if (next === status || isPending) return
    setStatus(next)
    startTransition(async () => {
      await updatePaymentStatusAction(garmentId, next)
    })
  }

  return (
    <div className="flex items-center gap-0.5">
      {BUTTONS.map((btn) => {
        const isActive = status === btn.value
        return (
          <button
            key={btn.value}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleClick(btn.value)
            }}
            disabled={isPending}
            style={isActive ? ACTIVE_STYLES[btn.value] : undefined}
            className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              isActive
                ? ''
                : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted'
            }`}
          >
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}
