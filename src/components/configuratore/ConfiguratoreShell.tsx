'use client'

import { useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { saveGarmentAction } from '@/lib/actions/garments'
import type { ConfiguratoreState, ConfigStep } from '@/types/configuratore'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

import { CatalogProvider } from './CatalogContext'
import { ConfiguratoreProgress } from './ConfiguratoreProgress'
import { ConfiguratoreSidebar } from './ConfiguratoreSidebar'
import { StepNavigation } from './StepNavigation'
import { STEP_REGISTRY } from './stepRegistry'

interface Props {
  garmentId: string
  clientId: string
  clientName: string
  garmentName: string
  initialStep: string
  initialConfig: ConfiguratoreState
  measurementsCount: number
  origin: 'produzione' | 'clienti'
  fabrics: Fabric[]
  linings: Lining[]
  buttons: ButtonType[]
  threadColors: ThreadColor[]
}

export function ConfiguratoreShell({
  garmentId, clientId, clientName, garmentName,
  initialStep, initialConfig, measurementsCount, origin,
  fabrics, linings, buttons, threadColors,
}: Props) {
  const hydrate = useConfiguratoreStore((s) => s.hydrate)
  const garmentNameInStore = useConfiguratoreStore((s) => s.garmentName)
  const currentStep = useConfiguratoreStore((s) => s.currentStep)
  const isDirty = useConfiguratoreStore((s) => s.isDirty)
  const isSaving = useConfiguratoreStore((s) => s.isSaving)
  const config = useConfiguratoreStore((s) => s.config)
  const markSaved = useConfiguratoreStore((s) => s.markSaved)
  const markSaving = useConfiguratoreStore((s) => s.markSaving)
  const goNext = useConfiguratoreStore((s) => s.goNext)
  const goBack = useConfiguratoreStore((s) => s.goBack)

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    hydrate({
      garmentId,
      clientId,
      name: garmentName,
      step: initialStep,
      state: initialConfig,
      origin,
      measurementsCount,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentId])

  const save = useCallback(async () => {
    if (!isDirty || isSaving) return
    markSaving(true)
    await saveGarmentAction(garmentId, garmentNameInStore, currentStep, config)
    markSaved()
    markSaving(false)
  }, [garmentId, garmentNameInStore, currentStep, config, isDirty, isSaving, markSaved, markSaving])

  // Autosave after 3s of inactivity
  useEffect(() => {
    if (!isDirty) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => { save() }, 3000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [isDirty, config, save])

  // Keyboard shortcuts: Enter=next, Backspace (outside inputs)=back, Esc=exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inField = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )

      if (e.key === 'Enter' && !inField) {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === 'Backspace' && !inField) {
        e.preventDefault()
        goBack()
        return
      }
      if (e.key === 'Escape') {
        const url = origin === 'produzione' ? '/dashboard/produzione' : `/dashboard/clienti/${clientId}`
        window.location.href = url
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goBack, origin, clientId])

  const backHref =
    origin === 'produzione' ? '/dashboard/produzione' : `/dashboard/clienti/${clientId}`
  const backLabel = origin === 'produzione' ? 'Torna a Produzione' : `Torna a ${clientName}`

  const isReview = currentStep === 'review'
  const renderStep = STEP_REGISTRY[currentStep as ConfigStep]

  return (
    <CatalogProvider value={{ fabrics, linings, buttons, threadColors }}>
      <div className="flex h-full overflow-hidden bg-background">
        <ConfiguratoreSidebar
          clientName={clientName}
          backHref={backHref}
          backLabel={backLabel}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <ConfiguratoreProgress />

          {/* Save status bar */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2 shrink-0">
            <span className="text-xs text-muted-foreground">{garmentNameInStore}</span>
            <div className="flex items-center gap-3">
              {isDirty && !isSaving && (
                <span className="text-xs text-muted-foreground">Modifiche non salvate</span>
              )}
              {isSaving && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Salvataggio…
                </span>
              )}
              {!isDirty && !isSaving && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3" /> Salvato
                </span>
              )}
              <Button size="xs" variant="outline" onClick={save} disabled={!isDirty || isSaving}>
                <Save className="size-3" /> Salva
              </Button>
            </div>
          </div>

          {/* Step content */}
          <main className="flex-1 overflow-y-auto">
            <div key={currentStep} className="px-6">
              {renderStep ? renderStep({ clientName }) : (
                <div className="py-16 text-center text-muted-foreground">
                  Step non riconosciuto: <code>{currentStep}</code>
                </div>
              )}
            </div>
          </main>

          {/* Footer navigation — hidden on review */}
          {!isReview && <StepNavigation />}
        </div>
      </div>
    </CatalogProvider>
  )
}
