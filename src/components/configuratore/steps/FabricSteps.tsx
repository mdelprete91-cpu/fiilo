'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import { useCatalog } from '../CatalogContext'
import { ChoiceStep } from './atoms/ChoiceStep'
import type { ChoiceOption } from './atoms/ChoiceStep'

export function FabricPrimaryStep() {
  const { fabrics } = useCatalog()
  const value = useConfiguratoreStore((s) => s.config.fabric.primaryFabricId)
  const setFabric = useConfiguratoreStore((s) => s.setFabric)
  const goNext = useConfiguratoreStore((s) => s.goNext)

  const options: ChoiceOption<string>[] = fabrics.map((f) => ({
    value: f.id,
    label: f.name,
    description: f.composition ?? undefined,
  }))

  return (
    <ChoiceStep<string>
      question="Quale tessuto principale?"
      description="Lo stesso tessuto sarà usato per giacca e pantalone, salvo contrasti."
      options={options}
      value={value}
      onChoice={(v) => {
        setFabric({ primaryFabricId: v })
        goNext()
      }}
      layout="grid"
    />
  )
}

export function FabricContrastStep() {
  const { fabrics } = useCatalog()
  const value = useConfiguratoreStore((s) => s.config.fabric.contrastFabricId)
  const setFabric = useConfiguratoreStore((s) => s.setFabric)
  const goNext = useConfiguratoreStore((s) => s.goNext)

  const options: ChoiceOption<string>[] = [
    { value: '__none__', label: 'Nessun contrasto', description: 'Continua senza tessuto secondario' },
    ...fabrics.map((f) => ({
      value: f.id,
      label: f.name,
      description: f.composition ?? undefined,
    })),
  ]

  return (
    <ChoiceStep<string>
      question="Tessuto in contrasto?"
      description="Opzionale — sarà disponibile per bavero, polsi o pantaloni."
      options={options}
      value={value ?? null}
      onChoice={(v) => {
        setFabric({ contrastFabricId: v === '__none__' ? null : v })
        goNext()
      }}
      layout={fabrics.length > 4 ? 'grid' : 'list'}
    />
  )
}
