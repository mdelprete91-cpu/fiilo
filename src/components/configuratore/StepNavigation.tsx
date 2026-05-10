'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { getVisibleSteps } from '@/lib/configuratore/steps'

interface Props {
  /**
   * Whether the primary "Avanti" button should be disabled (e.g. the current
   * step has no value yet and is not auto-advancing).
   */
  canAdvance?: boolean
  /** Override the next-button label (e.g. "Conferma ordine" on the review step). */
  nextLabel?: string
  /** Hide the next button (e.g. atomic step manages its own confirm). */
  hideNext?: boolean
}

export function StepNavigation({ canAdvance = true, nextLabel = 'Avanti', hideNext = false }: Props) {
  const goBack = useConfiguratoreStore((s) => s.goBack)
  const goNext = useConfiguratoreStore((s) => s.goNext)
  const currentStep = useConfiguratoreStore((s) => s.currentStep)
  const config = useConfiguratoreStore((s) => s.config)
  const measurementsCount = useConfiguratoreStore((s) => s.measurementsCount)

  const visible = getVisibleSteps(config, { measurementsCount })
  const i = visible.findIndex((s) => s.id === currentStep)
  const isFirst = i <= 0
  const isLast = i === visible.length - 1
  const total = visible.length

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="lg"
        onClick={goBack}
        disabled={isFirst}
        aria-label="Step precedente"
      >
        <ChevronLeft className="size-4" />
        Indietro
      </Button>

      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {i + 1} di {total}
      </span>

      {!hideNext && (
        <Button
          size="lg"
          onClick={goNext}
          disabled={isLast || !canAdvance}
          aria-label="Step successivo"
        >
          {nextLabel}
          <ChevronRight className="size-4" />
        </Button>
      )}
      {hideNext && <span className="w-[120px]" aria-hidden />}
    </div>
  )
}
