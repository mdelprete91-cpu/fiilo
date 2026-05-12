import type { ClientMeasurement } from '@/types/database'

interface Props {
  measurements: ClientMeasurement[]
  latest: ClientMeasurement | null
}

const MEASURE_GROUPS = [
  {
    label: 'Superiori',
    fields: [
      { key: 'chest', label: 'Torace' },
      { key: 'waist', label: 'Vita' },
      { key: 'hips', label: 'Fianchi' },
      { key: 'shoulders', label: 'Spalle' },
      { key: 'sleeve_length', label: 'Manica' },
      { key: 'back_length', label: 'Schiena' },
      { key: 'neck', label: 'Collo' },
      { key: 'wrist', label: 'Polso' },
    ],
  },
  {
    label: 'Inferiori',
    fields: [
      { key: 'crotch', label: 'Cavallo' },
      { key: 'inseam', label: 'Gamba int.' },
      { key: 'outseam', label: 'Gamba est.' },
      { key: 'thigh', label: 'Coscia' },
      { key: 'knee', label: 'Ginocchio' },
      { key: 'calf', label: 'Polpaccio' },
      { key: 'ankle', label: 'Caviglia' },
    ],
  },
  {
    label: 'Corporatura',
    fields: [
      { key: 'height', label: 'Altezza' },
      { key: 'weight', label: 'Peso (kg)' },
    ],
  },
] as const

type MeasureKey = keyof ClientMeasurement

export function MeasurementTimeline({ measurements, latest }: Props) {
  if (!measurements.length) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        Nessuna misurazione ancora.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {/* Misure attuali (più recenti) */}
      {latest && (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Ultima rilevazione
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(latest.taken_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          <div className="space-y-4">
            {MEASURE_GROUPS.map((group) => {
              const hasValues = group.fields.some(
                (f) => latest[f.key as MeasureKey] !== null
              )
              if (!hasValues) return null

              return (
                <div key={group.label}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {group.fields.map((f) => {
                      const val = latest[f.key as MeasureKey]
                      if (val === null || val === undefined) return null
                      return (
                        <div key={f.key} className="flex items-baseline justify-between gap-1">
                          <span className="text-xs text-muted-foreground">{f.label}</span>
                          <span className="text-sm font-medium tabular-nums">
                            {typeof val === 'number' ? val.toFixed(1) : String(val)}
                            <span className="ml-0.5 text-[10px] text-muted-foreground">cm</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {latest.posture_notes && (
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <span className="font-medium">Note posturali: </span>
                {latest.posture_notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storico rilevazioni precedenti */}
      {measurements.length > 1 && (
        <div className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Storico rilevazioni
          </p>
          <div className="relative space-y-3 pl-4">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
            {measurements.slice(1).map((m) => (
              <div key={m.id} className="relative pl-4">
                <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
                <p className="text-xs text-muted-foreground">
                  {new Date(m.taken_at).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {[
                    m.chest && `T ${m.chest}cm`,
                    m.waist && `V ${m.waist}cm`,
                    m.hips && `F ${m.hips}cm`,
                  ].filter(Boolean).join(' · ') || 'Misure complete registrate'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
