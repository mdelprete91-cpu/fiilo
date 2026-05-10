'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { getVisibleSteps } from '@/lib/configuratore/steps'

/**
 * Slim progress bar at the top of the configurator. Shows the proportion of
 * visible steps the user has reached.
 */
export function ConfiguratoreProgress() {
  const currentStep = useConfiguratoreStore((s) => s.currentStep)
  const config = useConfiguratoreStore((s) => s.config)
  const measurementsCount = useConfiguratoreStore((s) => s.measurementsCount)

  const visible = getVisibleSteps(config, { measurementsCount })
  const i = visible.findIndex((s) => s.id === currentStep)
  const pct = visible.length > 0 ? ((i + 1) / visible.length) * 100 : 0

  return (
    <div className="h-0.5 w-full bg-border" aria-hidden>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
