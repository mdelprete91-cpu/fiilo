'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import type {
  PantCut, PantWaist, PleatType, PleatDirection, PantPocketType, BackPocketType, CuffHeight,
} from '@/types/configuratore'

import { ChoiceStep, type ChoiceOption } from './atoms/ChoiceStep'
import { ToggleStep } from './atoms/ToggleStep'

function usePant() {
  return {
    config: useConfiguratoreStore((s) => s.config.pant),
    setPant: useConfiguratoreStore((s) => s.setPant),
    goNext: useConfiguratoreStore((s) => s.goNext),
  }
}

const CUTS: ChoiceOption<PantCut>[] = [
  { value: 'classico', label: 'Classico', description: 'Vestibilità tradizionale' },
  { value: 'slim', label: 'Slim', description: 'Aderente lungo tutta la gamba' },
  { value: 'wide_leg', label: 'Wide leg', description: 'Gamba ampia, palazzo' },
  { value: 'carrot', label: 'Carrot', description: 'Largo in alto, stretto in basso' },
]

export function PantCutStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Taglio del pantalone"
      options={CUTS}
      value={config.cut}
      onChoice={(v) => { setPant({ cut: v }); goNext() }}
    />
  )
}

const WAISTS: ChoiceOption<PantWaist>[] = [
  { value: 'bassa', label: 'Vita bassa' },
  { value: 'media', label: 'Vita media', description: 'Standard' },
  { value: 'alta', label: 'Vita alta', description: 'Stile classico/anni 30' },
]

export function PantWaistStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Altezza vita"
      options={WAISTS}
      value={config.waist}
      onChoice={(v) => { setPant({ waist: v }); goNext() }}
    />
  )
}

export function PantSuspenderStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ToggleStep
      question="Bottoni per le bretelle?"
      description="Cuciti all'interno della cintura."
      value={config.suspenderButtons ?? null}
      onChoice={(v) => { setPant({ suspenderButtons: v }); goNext() }}
    />
  )
}

const PLEATS: ChoiceOption<PleatType>[] = [
  { value: 'flat', label: 'Senza pinces', description: 'Davanti liscio' },
  { value: 'single', label: 'Una pince per gamba' },
  { value: 'double', label: 'Due pinces per gamba' },
]

export function PantPleatStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Pinces davanti"
      options={PLEATS}
      value={config.pleat}
      onChoice={(v) => {
        setPant({
          pleat: v,
          pleatDirection: v === 'flat' ? null : config.pleatDirection,
        })
        goNext()
      }}
    />
  )
}

const PLEAT_DIRECTIONS: ChoiceOption<PleatDirection>[] = [
  { value: 'forward', label: 'In avanti', description: 'Verso l\'esterno della gamba' },
  { value: 'reverse', label: 'All\'indietro', description: 'Verso la cucitura centrale' },
]

export function PantPleatDirectionStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Direzione delle pinces"
      options={PLEAT_DIRECTIONS}
      value={config.pleatDirection}
      onChoice={(v) => { setPant({ pleatDirection: v }); goNext() }}
    />
  )
}

const SIDE_POCKETS: ChoiceOption<PantPocketType>[] = [
  { value: 'americana', label: 'Tasca americana', description: 'Apertura verticale' },
  { value: 'francesa', label: 'Tasca alla francese', description: 'Apertura inclinata' },
  { value: 'dritta', label: 'Tasca dritta', description: 'Apertura orizzontale, classico' },
]

export function PantSidePocketStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Tasche laterali"
      options={SIDE_POCKETS}
      value={config.sidePocket}
      onChoice={(v) => { setPant({ sidePocket: v }); goNext() }}
    />
  )
}

const BACK_POCKET_COUNTS: ChoiceOption<0 | 1 | 2>[] = [
  { value: 0, label: 'Nessuna tasca dietro' },
  { value: 1, label: '1 tasca dietro' },
  { value: 2, label: '2 tasche dietro', description: 'Standard' },
]

export function PantBackPocketCountStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep<0 | 1 | 2>
      question="Tasche posteriori"
      options={BACK_POCKET_COUNTS}
      value={config.backPocketCount}
      onChoice={(v) => {
        setPant({
          backPocketCount: v,
          backPocketType: v === 0 ? null : config.backPocketType,
        })
        goNext()
      }}
    />
  )
}

const BACK_POCKET_TYPES: ChoiceOption<BackPocketType>[] = [
  { value: 'jetted', label: 'A filetto', description: 'Apertura pulita' },
  { value: 'flap', label: 'Con pattina' },
  { value: 'button', label: 'Con bottone' },
]

export function PantBackPocketTypeStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep
      question="Tipo di tasche posteriori"
      options={BACK_POCKET_TYPES}
      value={config.backPocketType}
      onChoice={(v) => { setPant({ backPocketType: v }); goNext() }}
    />
  )
}

export function PantBackPocketButtonStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ToggleStep
      question="Bottone di chiusura sulle tasche posteriori?"
      value={config.backPocketButton ?? null}
      onChoice={(v) => { setPant({ backPocketButton: v }); goNext() }}
    />
  )
}

export function PantBeltLoopsStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ToggleStep
      question="Passanti per la cintura?"
      description="Senza passanti = vita pulita, di solito con tiretti laterali."
      value={config.beltLoops ?? null}
      onChoice={(v) => {
        setPant({
          beltLoops: v,
          beltLoopCount: v ? config.beltLoopCount ?? 6 : null,
        })
        goNext()
      }}
    />
  )
}

const LOOP_COUNTS: ChoiceOption<5 | 6 | 7>[] = [
  { value: 5, label: '5 passanti' },
  { value: 6, label: '6 passanti', description: 'Standard' },
  { value: 7, label: '7 passanti' },
]

export function PantBeltLoopCountStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep<5 | 6 | 7>
      question="Numero di passanti"
      options={LOOP_COUNTS}
      value={config.beltLoopCount}
      onChoice={(v) => { setPant({ beltLoopCount: v }); goNext() }}
    />
  )
}

export function PantSideAdjustersStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ToggleStep
      question="Tiretti laterali (side adjusters)?"
      description="Regolazione laterale al posto della cintura."
      value={config.sideAdjusters ?? null}
      onChoice={(v) => { setPant({ sideAdjusters: v }); goNext() }}
    />
  )
}

export function PantCuffStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ToggleStep
      question="Risvolto al fondo?"
      description="Risvolto = bordo piegato. No risvolto = fondo dritto."
      value={config.cuff ?? null}
      onChoice={(v) => {
        setPant({ cuff: v, cuffHeight: v ? config.cuffHeight ?? 4 : null })
        goNext()
      }}
    />
  )
}

const CUFF_HEIGHTS: ChoiceOption<CuffHeight>[] = [
  { value: 3, label: '3 cm', description: 'Sottile' },
  { value: 4, label: '4 cm', description: 'Standard' },
  { value: 5, label: '5 cm', description: 'Pronunciato' },
]

export function PantCuffHeightStep() {
  const { config, setPant, goNext } = usePant()
  return (
    <ChoiceStep<CuffHeight>
      question="Altezza del risvolto"
      options={CUFF_HEIGHTS}
      value={config.cuffHeight}
      onChoice={(v) => { setPant({ cuffHeight: v }); goNext() }}
    />
  )
}
