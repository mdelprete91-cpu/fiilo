'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import type { VestBreast, VestLapel, VestBackMaterial } from '@/types/configuratore'

import { ChoiceStep, type ChoiceOption } from './atoms/ChoiceStep'
import { ToggleStep } from './atoms/ToggleStep'

function useVest() {
  return {
    config: useConfiguratoreStore((s) => s.config.vest),
    setVest: useConfiguratoreStore((s) => s.setVest),
    goNext: useConfiguratoreStore((s) => s.goNext),
  }
}

const BREASTS: ChoiceOption<VestBreast>[] = [
  { value: 'single', label: 'Monopetto', description: 'Più formale' },
  { value: 'double', label: 'Doppiopetto', description: 'Stile vintage' },
]

export function VestBreastStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ChoiceStep
      question="Petto del gilet"
      options={BREASTS}
      value={config?.breast ?? null}
      onChoice={(v) => { setVest({ breast: v }); goNext() }}
    />
  )
}

const LAPELS: ChoiceOption<VestLapel>[] = [
  { value: 'none', label: 'Senza bavero' },
  { value: 'notch', label: 'A punta in giù' },
  { value: 'peak', label: 'A lancia' },
  { value: 'shawl', label: 'A scialle' },
]

export function VestLapelStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ChoiceStep
      question="Bavero del gilet"
      options={LAPELS}
      value={config?.lapel ?? null}
      onChoice={(v) => { setVest({ lapel: v }); goNext() }}
    />
  )
}

const BUTTON_COUNTS: ChoiceOption<number>[] = [
  { value: 4, label: '4 bottoni' },
  { value: 5, label: '5 bottoni', description: 'Standard' },
  { value: 6, label: '6 bottoni' },
]

export function VestButtonCountStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ChoiceStep
      question="Quanti bottoni davanti?"
      options={BUTTON_COUNTS}
      value={config?.buttonCount ?? null}
      onChoice={(v) => { setVest({ buttonCount: v }); goNext() }}
    />
  )
}

const BACK_MATERIALS: ChoiceOption<VestBackMaterial>[] = [
  { value: 'fabric', label: 'Tessuto principale', description: 'Stessa stoffa della giacca' },
  { value: 'satin', label: 'Raso', description: 'Schiena lucida, classico smoking' },
]

export function VestBackMaterialStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ChoiceStep
      question="Materiale della schiena"
      options={BACK_MATERIALS}
      value={config?.backMaterial ?? null}
      onChoice={(v) => { setVest({ backMaterial: v }); goNext() }}
    />
  )
}

const POCKET_COUNTS: ChoiceOption<2 | 4>[] = [
  { value: 2, label: '2 tasche', description: 'Solo le inferiori' },
  { value: 4, label: '4 tasche', description: 'Inferiori + superiori' },
]

export function VestPocketsStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ChoiceStep<2 | 4>
      question="Tasche del gilet"
      options={POCKET_COUNTS}
      value={config?.pocketCount ?? null}
      onChoice={(v) => { setVest({ pocketCount: v }); goNext() }}
    />
  )
}

export function VestBackBeltStep() {
  const { config, setVest, goNext } = useVest()
  return (
    <ToggleStep
      question="Cinturino regolabile dietro?"
      description="Fibbia per regolare la vestibilità sul retro."
      value={config?.backBelt ?? null}
      onChoice={(v) => { setVest({ backBelt: v }); goNext() }}
    />
  )
}
