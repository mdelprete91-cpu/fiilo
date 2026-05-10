'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MeasurementSchema, type MeasurementFormData } from '@/lib/validations/client'
import { createMeasurementAction } from '@/lib/actions/clients'

interface MeasurementFormProps {
  clientId: string
  onSuccess?: () => void
}

const MEASURE_GROUPS = [
  {
    label: 'Misure superiori',
    desc: 'Tutte le misure in centimetri',
    fields: [
      { name: 'chest', label: 'Torace' },
      { name: 'waist', label: 'Vita' },
      { name: 'hips', label: 'Fianchi' },
      { name: 'shoulders', label: 'Spalle' },
      { name: 'sleeve_length', label: 'Lunghezza manica' },
      { name: 'back_length', label: 'Lunghezza schiena' },
      { name: 'neck', label: 'Collo' },
      { name: 'wrist', label: 'Polso' },
    ],
  },
  {
    label: 'Misure inferiori',
    desc: 'Gambe e cavallo',
    fields: [
      { name: 'crotch', label: 'Cavallo' },
      { name: 'inseam', label: 'Gamba interna' },
      { name: 'outseam', label: 'Gamba esterna' },
      { name: 'thigh', label: 'Coscia' },
      { name: 'knee', label: 'Ginocchio' },
      { name: 'calf', label: 'Polpaccio' },
      { name: 'ankle', label: 'Caviglia' },
    ],
  },
  {
    label: 'Corporatura',
    desc: '',
    fields: [
      { name: 'height', label: 'Altezza (cm)' },
      { name: 'weight', label: 'Peso (kg)' },
    ],
  },
] as const

export function MeasurementForm({ clientId, onSuccess }: MeasurementFormProps) {
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0] ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MeasurementFormData, any, MeasurementFormData>({
    resolver: zodResolver(MeasurementSchema) as any,
    defaultValues: { taken_at: today },
  })

  function onSubmit(data: MeasurementFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.set(k, String(v))
      })

      const result = await createMeasurementAction(clientId, fd)
      if (!result.success) {
        setError('root', { message: result.error })
      } else {
        onSuccess?.()
        history.back()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errors.root && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* Data rilevazione */}
      <div className="max-w-xs">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Data rilevazione *
        </Label>
        <Input type="date" className="mt-1.5" {...register('taken_at')} />
        {errors.taken_at && (
          <p className="mt-1 text-xs text-destructive">{errors.taken_at.message}</p>
        )}
      </div>

      {/* Gruppi di misure */}
      {MEASURE_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-3 border-b border-border pb-2">
            <h3 className="font-heading text-base text-ink">{group.label}</h3>
            {group.desc && (
              <p className="text-xs text-muted-foreground">{group.desc}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.fields.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{f.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="—"
                    className="pr-7 tabular-nums"
                    {...register(f.name as keyof MeasurementFormData)}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {f.name === 'weight' ? 'kg' : 'cm'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Note posturali */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Note posturali
        </Label>
        <Textarea
          placeholder="Es: spalla destra leggermente più bassa, pancia prominente, postura ricurva…"
          rows={3}
          {...register('posture_notes')}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salva misure
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Annulla
        </Button>
      </div>
    </form>
  )
}
