'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronRight, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import {
  SECTION_ORDER,
  getVisibleSteps,
} from '@/lib/configuratore/steps'
import type { ConfigStep, StepDef, StepSection } from '@/types/configuratore'

interface Props {
  clientName: string
  /** "Torna a Produzione" / "Torna a {clientName}" — wired by the shell. */
  backHref: string
  backLabel: string
}

export function ConfiguratoreSidebar({ clientName, backHref, backLabel }: Props) {
  const currentStep = useConfiguratoreStore((s) => s.currentStep)
  const config = useConfiguratoreStore((s) => s.config)
  const measurementsCount = useConfiguratoreStore((s) => s.measurementsCount)
  const setStep = useConfiguratoreStore((s) => s.setStep)
  const garmentName = useConfiguratoreStore((s) => s.garmentName)

  const visible = getVisibleSteps(config, { measurementsCount })
  const currentIndex = visible.findIndex((s) => s.id === currentStep)

  // Group visible steps by section, in SECTION_ORDER.
  const grouped = SECTION_ORDER.map((sec) => ({
    ...sec,
    steps: visible.filter((s) => s.section === sec.id),
  })).filter((g) => g.steps.length > 0)

  const sectionOfCurrent = visible[currentIndex]?.section
  const [openSections, setOpenSections] = useState<Set<StepSection>>(
    () => new Set([sectionOfCurrent].filter(Boolean) as StepSection[]),
  )

  const toggleSection = (id: StepSection) =>
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r bg-card text-sm"
      aria-label="Navigazione configuratore"
    >
      {/* Back link */}
      <a
        href={backHref}
        className="flex items-center gap-2 border-b border-border px-5 py-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        {backLabel}
      </a>

      {/* Garment / client header */}
      <div className="border-b border-border px-5 py-4">
        <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
          {clientName}
        </p>
        <p className="font-heading text-lg font-light text-ink">{garmentName}</p>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {grouped.map((group, gi) => {
          const isOpen = openSections.has(group.id) || group.steps.some((s) => s.id === currentStep)
          const reachedAt = group.steps.findIndex((s) => visible.findIndex((v) => v.id === s.id) <= currentIndex)
          const completedCount = group.steps.filter(
            (s) => visible.findIndex((v) => v.id === s.id) < currentIndex,
          ).length
          const lastStep = group.steps[group.steps.length - 1]
          const isCompleted = !!lastStep
            && completedCount === group.steps.length
            && currentIndex > visible.findIndex((v) => v.id === lastStep.id)
          const sectionNumber = gi + 1

          return (
            <div key={group.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggleSection(group.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : reachedAt !== -1
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                  aria-hidden
                >
                  {isCompleted ? <Check className="size-3" /> : sectionNumber}
                </span>
                <span className="flex-1 text-xs font-medium uppercase tracking-wide text-foreground">
                  {group.label}
                </span>
                {isOpen ? (
                  <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                )}
              </button>

              {isOpen && (
                <ul className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                  {group.steps.map((step) => (
                    <SidebarStepRow
                      key={step.id}
                      step={step}
                      currentStep={currentStep}
                      visible={visible}
                      currentIndex={currentIndex}
                      onClick={() => setStep(step.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function SidebarStepRow({
  step,
  currentStep,
  visible,
  currentIndex,
  onClick,
}: {
  step: StepDef
  currentStep: ConfigStep
  visible: StepDef[]
  currentIndex: number
  onClick: () => void
}) {
  const idx = visible.findIndex((v) => v.id === step.id)
  const isActive = step.id === currentStep
  const isCompleted = idx < currentIndex

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
          isActive && 'bg-primary/10 font-medium text-foreground',
          !isActive && 'text-foreground hover:bg-muted/40',
        )}
      >
        <span
          className={cn(
            'inline-flex size-3 shrink-0 items-center justify-center rounded-full',
            isCompleted ? 'bg-primary' : isActive ? 'bg-primary/40' : 'bg-border',
          )}
          aria-hidden
        />
        <span className="truncate">{step.label}</span>
      </button>
    </li>
  )
}
