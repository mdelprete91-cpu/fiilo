'use client'

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { CUSTOMER_STEPS } from '@/lib/configuratore/customer-steps'
import { SECTION_ORDER, getVisibleSteps } from '@/lib/configuratore/steps'
import { saveCustomerDraftAction, submitOrderAction } from '@/lib/actions/customer-orders'
import { STEP_REGISTRY } from '@/components/configuratore/stepRegistry'
import { CatalogProvider } from '@/components/configuratore/CatalogContext'
import type { ConfiguratoreState, ConfigStep, StepDef } from '@/types/configuratore'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

interface Props {
  garmentId: string
  tenantSlug: string
  clientId: string
  clientName: string
  garmentName: string
  initialStep: string
  initialConfig: ConfiguratoreState
  measurementsCount: number
  fabrics: Fabric[]
  linings: Lining[]
  buttons: ButtonType[]
  threadColors: ThreadColor[]
  isSubmitted: boolean
}

export function CustomerConfiguratore({
  garmentId,
  tenantSlug,
  clientId,
  clientName,
  garmentName,
  initialStep,
  initialConfig,
  measurementsCount,
  fabrics,
  linings,
  buttons,
  threadColors,
  isSubmitted,
}: Props) {
  const router = useRouter()
  const hydrate = useConfiguratoreStore((s) => s.hydrate)
  const garmentNameInStore = useConfiguratoreStore((s) => s.garmentName)
  const currentStep = useConfiguratoreStore((s) => s.currentStep)
  const isDirty = useConfiguratoreStore((s) => s.isDirty)
  const isSaving = useConfiguratoreStore((s) => s.isSaving)
  const config = useConfiguratoreStore((s) => s.config)
  const markSaved = useConfiguratoreStore((s) => s.markSaved)
  const markSaving = useConfiguratoreStore((s) => s.markSaving)
  const setStep = useConfiguratoreStore((s) => s.setStep)

  const [submitting, setSubmitting] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    hydrate({
      garmentId,
      clientId,
      name: garmentName,
      step: initialStep,
      state: initialConfig,
      origin: 'clienti',
      measurementsCount,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentId])

  // Step visibili = whitelist customer ∩ visibili in base allo state
  const visibleSteps = useMemo<StepDef[]>(() => {
    const baseVisible = getVisibleSteps(config, { measurementsCount })
    return baseVisible.filter((s) => CUSTOMER_STEPS.has(s.id))
  }, [config, measurementsCount])

  // Se il currentStep esce dalla whitelist (es. perché lo store viene
  // riportato a uno step intermedio non esposto), forziamo il primo step
  // disponibile per il customer.
  useEffect(() => {
    if (!visibleSteps.some((s) => s.id === currentStep)) {
      const first = visibleSteps[0]?.id
      if (first) setStep(first)
    }
  }, [visibleSteps, currentStep, setStep])

  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep)
  const isReview = currentStep === 'review'

  const save = useCallback(async () => {
    if (!isDirty || isSaving) return
    markSaving(true)
    const res = await saveCustomerDraftAction(garmentId, {
      name: garmentNameInStore,
      currentStep,
      config,
    })
    if (!res.success) toast.error(res.error)
    markSaved()
    markSaving(false)
  }, [garmentId, garmentNameInStore, currentStep, config, isDirty, isSaving, markSaved, markSaving])

  // Autosave dopo 2.5s di inattività (più reattivo per il portale cliente)
  useEffect(() => {
    if (!isDirty) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      save()
    }, 2500)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [isDirty, config, save])

  function goBackStep() {
    const i = visibleSteps.findIndex((s) => s.id === currentStep)
    if (i > 0) setStep(visibleSteps[i - 1]!.id)
  }

  function goNextStep() {
    const i = visibleSteps.findIndex((s) => s.id === currentStep)
    if (i >= 0 && i < visibleSteps.length - 1) setStep(visibleSteps[i + 1]!.id)
  }

  async function handleSubmit() {
    setSubmitting(true)
    // Salva prima di submitter
    await save()
    const res = await submitOrderAction(garmentId)
    setSubmitting(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    toast.success('Richiesta inviata alla sartoria.')
    router.push(`/c/${tenantSlug}/abiti`)
  }

  const renderStep = STEP_REGISTRY[currentStep as ConfigStep]

  // Group sections for the side rail
  const grouped = SECTION_ORDER.map((sec) => ({
    ...sec,
    steps: visibleSteps.filter((s) => s.section === sec.id),
  })).filter((g) => g.steps.length > 0)

  return (
    <CatalogProvider value={{ fabrics, linings, buttons, threadColors }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {clientName} · Nuovo ordine
            </p>
            <h1 className="font-heading text-2xl text-ink md:text-3xl">{garmentNameInStore}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Salvataggio…
              </span>
            )}
            {!isSaving && !isDirty && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="size-3" /> Salvato
              </span>
            )}
            {!isSaving && isDirty && <span>Modifiche non salvate</span>}
          </div>
        </div>

        {/* Banner se l'ordine è già stato inviato */}
        {isSubmitted && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            Questo ordine è già stato inviato alla sartoria. Puoi ancora rivederlo, ma per modifiche contatta direttamente il sarto.
          </div>
        )}

        {/* Progress */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${visibleSteps.length > 0 ? ((currentIndex + 1) / visibleSteps.length) * 100 : 0}%`,
              backgroundColor: 'var(--brand-color)',
            }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Side rail */}
          <aside className="hidden lg:block">
            <nav className="space-y-4 text-sm">
              {grouped.map((g) => (
                <div key={g.id}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                    {g.label}
                  </p>
                  <ul className="space-y-1">
                    {g.steps.map((step) => {
                      const isActive = step.id === currentStep
                      const idx = visibleSteps.findIndex((v) => v.id === step.id)
                      const isComplete = idx < currentIndex
                      return (
                        <li key={step.id}>
                          <button
                            type="button"
                            onClick={() => setStep(step.id)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
                              isActive
                                ? 'bg-muted font-medium text-foreground'
                                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            }`}
                          >
                            <span
                              className={`inline-block size-1.5 rounded-full ${
                                isComplete ? 'bg-emerald-500' : isActive ? 'bg-foreground' : 'bg-border'
                              }`}
                            />
                            {step.label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Step content */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card px-4 py-5 md:px-6 md:py-6">
              <div key={currentStep}>
                {renderStep ? (
                  renderStep({ clientName })
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Step non disponibile per il portale cliente.
                  </p>
                )}
              </div>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={goBackStep}
                disabled={currentIndex <= 0}
              >
                Indietro
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {currentIndex + 1} di {visibleSteps.length}
              </span>
              {isReview ? (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting || isSubmitted}
                  className="rounded-full px-5 text-white"
                  style={{ backgroundColor: 'var(--brand-color)' }}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSubmitted ? 'Già inviato' : 'Invia richiesta'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={goNextStep}
                  disabled={currentIndex >= visibleSteps.length - 1}
                >
                  Avanti
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CatalogProvider>
  )
}
