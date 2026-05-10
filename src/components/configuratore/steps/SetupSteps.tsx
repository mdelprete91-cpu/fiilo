'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeasurementAction } from '@/lib/actions/clients'
import { useConfiguratoreStore } from '@/lib/configuratore/store'
import type { GarmentType } from '@/types/database'

import { ChoiceStep } from './atoms/ChoiceStep'
import type { ChoiceOption } from './atoms/ChoiceStep'
import { StepFrame } from './atoms/StepFrame'

const GARMENT_TYPES: ChoiceOption<GarmentType>[] = [
  { value: 'suit_2pc', label: 'Abito 2 pezzi', description: 'Giacca + pantalone' },
  { value: 'suit_3pc', label: 'Abito 3 pezzi', description: 'Giacca + pantalone + gilet' },
  { value: 'jacket', label: 'Solo giacca' },
  { value: 'trousers', label: 'Solo pantalone' },
  { value: 'tuxedo', label: 'Smoking', description: 'Con gilet abbinato' },
  { value: 'coat', label: 'Cappotto' },
  { value: 'waistcoat', label: 'Solo gilet' },
  { value: 'shirt', label: 'Camicia' },
]

export function GarmentTypeStep() {
  const value = useConfiguratoreStore((s) => s.config.garmentType)
  const setGarmentType = useConfiguratoreStore((s) => s.setGarmentType)
  const goNext = useConfiguratoreStore((s) => s.goNext)
  return (
    <ChoiceStep<GarmentType>
      question="Che capo stai creando?"
      description="La scelta determina quali sezioni seguiranno."
      options={GARMENT_TYPES}
      value={value}
      onChoice={(v) => {
        setGarmentType(v)
        goNext()
      }}
      layout="grid"
    />
  )
}

const MEASURE_GROUPS = [
  {
    label: 'Misure superiori',
    fields: [
      { name: 'chest', label: 'Torace' },
      { name: 'waist', label: 'Vita' },
      { name: 'hips', label: 'Fianchi' },
      { name: 'shoulders', label: 'Spalle' },
      { name: 'sleeve_length', label: 'Manica' },
      { name: 'back_length', label: 'Schiena' },
      { name: 'neck', label: 'Collo' },
      { name: 'wrist', label: 'Polso' },
    ],
  },
  {
    label: 'Misure inferiori',
    fields: [
      { name: 'crotch', label: 'Cavallo' },
      { name: 'inseam', label: 'Gamba int.' },
      { name: 'outseam', label: 'Gamba est.' },
      { name: 'thigh', label: 'Coscia' },
      { name: 'knee', label: 'Ginocchio' },
      { name: 'calf', label: 'Polpaccio' },
      { name: 'ankle', label: 'Caviglia' },
    ],
  },
  {
    label: 'Corporatura',
    fields: [
      { name: 'height', label: 'Altezza (cm)' },
      { name: 'weight', label: 'Peso (kg)' },
    ],
  },
] as const

export function ClientMeasurementsStep() {
  const clientId = useConfiguratoreStore((s) => s.clientId)
  const setMeasurementId = useConfiguratoreStore((s) => s.setMeasurementId)
  const setMeasurementsCount = useConfiguratoreStore((s) => s.setMeasurementsCount)
  const measurementsCount = useConfiguratoreStore((s) => s.measurementsCount)
  const goNext = useConfiguratoreStore((s) => s.goNext)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0] ?? ''

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clientId) return
    const fd = new FormData(e.currentTarget)
    setError(null)

    startTransition(async () => {
      const res = await createMeasurementAction(clientId, fd)
      if (!res.success) {
        setError(res.error)
        return
      }
      // The action returns the new measurement row id in some implementations,
      // but the existing one returns void — mark count++ and advance.
      setMeasurementsCount(measurementsCount + 1)
      // measurementId is auto-attached by the latest-row query if needed; for
      // now we leave the field null (the latest measurement is the de facto one).
      setMeasurementId(null)
      goNext()
    })
  }

  return (
    <StepFrame
      question="Prendiamo le misure"
      description="Compila almeno torace, vita e gamba. Le altre puoi aggiungerle dopo."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6 text-left">
        <div className="max-w-xs">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Data rilevazione *
          </Label>
          <Input type="date" name="taken_at" defaultValue={today} required className="mt-1.5" />
        </div>

        {MEASURE_GROUPS.map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 border-b border-border pb-2 font-heading text-base text-ink">
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {group.fields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      name={f.name}
                      placeholder="—"
                      className="pr-7 tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      {f.name === 'weight' ? 'kg' : 'cm'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Note posturali
          </Label>
          <Textarea name="posture_notes" rows={2} className="mt-1.5" placeholder="Spalla destra più bassa…" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Salva misure e continua
          </Button>
        </div>
      </form>
    </StepFrame>
  )
}
