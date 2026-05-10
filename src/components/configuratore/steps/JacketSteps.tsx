'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import type {
  JacketCut, SartorialSchool, BreastType, ShoulderType, SleeveType,
  LapelType, LapelWidth, PocketType, BreastPocketType, VentType,
  SingleBreastedButtons, DoubleBreastedConfig,
} from '@/types/configuratore'

import { ChoiceStep, type ChoiceOption } from './atoms/ChoiceStep'
import { ToggleStep } from './atoms/ToggleStep'
import { NumberStep } from './atoms/NumberStep'

// ─── Helper hook to keep step boilerplate tiny ───────────────────────────────

function useJacket() {
  return {
    config: useConfiguratoreStore((s) => s.config.jacket),
    setJacket: useConfiguratoreStore((s) => s.setJacket),
    goNext: useConfiguratoreStore((s) => s.goNext),
  }
}

// ─── Style ───────────────────────────────────────────────────────────────────

const CUTS: ChoiceOption<JacketCut>[] = [
  { value: 'slim', label: 'Slim', description: 'Aderente, vita rientrata' },
  { value: 'fitted', label: 'Regolare', description: 'Equilibrato, taglio moderno' },
  { value: 'classic', label: 'Classico', description: 'Comodo, taglio tradizionale' },
]

export function JacketCutStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Che taglio per la giacca?"
      options={CUTS}
      value={config.cut}
      onChoice={(v) => { setJacket({ cut: v }); goNext() }}
    />
  )
}

const SCHOOLS: ChoiceOption<SartorialSchool>[] = [
  { value: 'napoletana', label: 'Napoletana', description: 'Spalla morbida, asola lavorata' },
  { value: 'milanese', label: 'Milanese', description: 'Linea pulita, struttura media' },
  { value: 'inglese', label: 'Inglese', description: 'Spalla strutturata, vestibilità severa' },
  { value: 'americana', label: 'Americana', description: 'Comoda, vestibilità rilassata' },
]

export function JacketSchoolStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Scuola sartoriale"
      description="Definisce la silhouette generale della giacca."
      options={SCHOOLS}
      value={config.school}
      onChoice={(v) => { setJacket({ school: v }); goNext() }}
    />
  )
}

const BREASTS: ChoiceOption<BreastType>[] = [
  { value: 'single', label: 'Monopetto' },
  { value: 'double', label: 'Doppiopetto' },
]

export function JacketBreastStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Petto"
      options={BREASTS}
      value={config.breast}
      onChoice={(v) => {
        setJacket({
          breast: v,
          // reset config opposta
          singleBreastedButtons: v === 'single' ? config.singleBreastedButtons : null,
          doubleBreastedConfig: v === 'double' ? config.doubleBreastedConfig : null,
        })
        goNext()
      }}
    />
  )
}

const SINGLE_BUTTONS: ChoiceOption<SingleBreastedButtons>[] = [
  { value: 1, label: '1 bottone' },
  { value: 2, label: '2 bottoni' },
  { value: 3, label: '3 bottoni' },
]

export function JacketSingleButtonsStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Quanti bottoni davanti?"
      options={SINGLE_BUTTONS}
      value={config.singleBreastedButtons}
      onChoice={(v) => { setJacket({ singleBreastedButtons: v }); goNext() }}
    />
  )
}

const DOUBLE_CONFIGS: ChoiceOption<DoubleBreastedConfig>[] = [
  { value: '6x2', label: '6×2', description: '6 bottoni, 2 chiusi' },
  { value: '6x1', label: '6×1', description: '6 bottoni, 1 chiuso' },
  { value: '4x2', label: '4×2', description: '4 bottoni, 2 chiusi' },
  { value: '4x1', label: '4×1', description: '4 bottoni, 1 chiuso' },
]

export function JacketDoubleConfigStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Configurazione doppiopetto"
      options={DOUBLE_CONFIGS}
      value={config.doubleBreastedConfig}
      onChoice={(v) => { setJacket({ doubleBreastedConfig: v }); goNext() }}
    />
  )
}

const SHOULDERS: ChoiceOption<ShoulderType>[] = [
  { value: 'napoletana_camicia', label: 'A camicia', description: 'Cucitura morbida tipo manica camicia' },
  { value: 'napoletana_mappina', label: 'Mappina', description: 'Manica arricciata in spalla' },
  { value: 'insellata', label: 'Insellata', description: 'Curva pronunciata sulla spalla' },
  { value: 'roped', label: 'Roped', description: 'Spalla rialzata e strutturata' },
  { value: 'padded', label: 'Imbottita', description: 'Linea pulita, struttura media' },
]

export function JacketShoulderStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Spalla"
      options={SHOULDERS}
      value={config.shoulder}
      onChoice={(v) => { setJacket({ shoulder: v }); goNext() }}
    />
  )
}

const SLEEVES: ChoiceOption<SleeveType>[] = [
  { value: 'rollino', label: 'Rollino', description: 'Manica con piccola arricciatura' },
  { value: 'liscia', label: 'Liscia', description: 'Manica pulita, senza arricciatura' },
]

export function JacketSleeveStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Manica"
      options={SLEEVES}
      value={config.sleeve}
      onChoice={(v) => { setJacket({ sleeve: v }); goNext() }}
    />
  )
}

// ─── Lapel ───────────────────────────────────────────────────────────────────

const LAPEL_TYPES: ChoiceOption<LapelType>[] = [
  { value: 'notch', label: 'A punta in giù', description: 'Standard sui monopetto' },
  { value: 'peak', label: 'A lancia', description: 'Più formale, tipico dei doppiopetto' },
  { value: 'shawl', label: 'A scialle', description: 'Ricurvo, da smoking' },
]

export function JacketLapelTypeStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Tipo di bavero"
      options={LAPEL_TYPES}
      value={config.lapelType}
      onChoice={(v) => { setJacket({ lapelType: v }); goNext() }}
    />
  )
}

const LAPEL_WIDTHS: ChoiceOption<LapelWidth>[] = [
  { value: 'narrow', label: 'Stretto', description: '6–7 cm' },
  { value: 'medium', label: 'Medio', description: '8–9 cm' },
  { value: 'wide', label: 'Largo', description: '10+ cm' },
]

export function JacketLapelWidthStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Larghezza bavero"
      options={LAPEL_WIDTHS}
      value={config.lapelWidth}
      onChoice={(v) => { setJacket({ lapelWidth: v }); goNext() }}
    />
  )
}

export function JacketButtonholeStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Asola lavorata sul bavero?"
      description="Tipica della scuola napoletana, opzionale altrove."
      value={config.lapelButtonhole ?? null}
      onChoice={(v) => { setJacket({ lapelButtonhole: v }); goNext() }}
    />
  )
}

export function JacketStabStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Impuntura visibile sul bavero?"
      value={config.stabStitching ?? null}
      onChoice={(v) => { setJacket({ stabStitching: v }); goNext() }}
    />
  )
}

export function JacketLapelPipingStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Profilo a contrasto sul bavero?"
      description="Dettaglio decorativo lungo il bordo del bavero."
      value={config.lapelPiping ?? null}
      onChoice={(v) => { setJacket({ lapelPiping: v }); goNext() }}
    />
  )
}

// ─── Bottom ──────────────────────────────────────────────────────────────────

const HEM_SHAPES: ChoiceOption<'squared' | 'rounded'>[] = [
  { value: 'squared', label: 'Quadrato', description: 'Fondo dritto' },
  { value: 'rounded', label: 'Arrotondato', description: 'Fondo curvo, classico monopetto' },
]

export function JacketHemShapeStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Forma del fondo"
      options={HEM_SHAPES}
      value={config.hemShape}
      onChoice={(v) => { setJacket({ hemShape: v }); goNext() }}
    />
  )
}

export function JacketLengthStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <NumberStep
      question="Variazione lunghezza giacca"
      description="Centimetri rispetto alla lunghezza standard. Positivo = più lunga, negativo = più corta."
      value={config.lengthOffset}
      onChange={(v) => setJacket({ lengthOffset: v ?? 0 })}
      onConfirm={goNext}
      min={-5}
      max={5}
      step={0.5}
      unit="cm"
      placeholder="0"
    />
  )
}

// ─── Pockets ─────────────────────────────────────────────────────────────────

const SIDE_POCKETS: ChoiceOption<PocketType>[] = [
  { value: 'flap', label: 'Con pattina', description: 'Più formale' },
  { value: 'jetted', label: 'A filetto', description: 'Linea pulita' },
  { value: 'patch', label: 'A toppa', description: 'Casual, applicata' },
  { value: 'slanted', label: 'Inclinate', description: 'Hacking pocket — caccia inglese' },
]

export function JacketSidePocketStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Tasche laterali"
      options={SIDE_POCKETS}
      value={config.sidePocket}
      onChoice={(v) => { setJacket({ sidePocket: v }); goNext() }}
    />
  )
}

const BREAST_POCKETS: ChoiceOption<BreastPocketType>[] = [
  { value: 'straight', label: 'Diritto', description: 'Taschino classico orizzontale' },
  { value: 'barchetta', label: 'A barchetta', description: 'Curvato, tipico napoletano' },
  { value: 'patch', label: 'A toppa', description: 'Applicato esterno' },
]

export function JacketBreastPocketStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Taschino al petto"
      options={BREAST_POCKETS}
      value={config.breastPocket}
      onChoice={(v) => { setJacket({ breastPocket: v }); goNext() }}
    />
  )
}

export function JacketTicketPocketStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Ticket pocket sopra la tasca destra?"
      description="Piccola tasca aggiuntiva, dettaglio inglese."
      value={config.ticketPocket ?? null}
      onChoice={(v) => { setJacket({ ticketPocket: v }); goNext() }}
    />
  )
}

// ─── Sleeve buttons ──────────────────────────────────────────────────────────

const SLEEVE_BUTTON_COUNTS: ChoiceOption<2 | 3 | 4>[] = [
  { value: 2, label: '2 bottoni' },
  { value: 3, label: '3 bottoni' },
  { value: 4, label: '4 bottoni' },
]

export function JacketSleeveButtonCountStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Quanti bottoni alla manica?"
      options={SLEEVE_BUTTON_COUNTS}
      value={config.sleeveButtonCount}
      onChoice={(v) => { setJacket({ sleeveButtonCount: v }); goNext() }}
    />
  )
}

export function JacketSurgeonsCuffsStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Bottoni lavorati (surgeon's cuffs)?"
      description="Asole funzionanti sui polsi."
      value={config.surgeonsCuffs ?? null}
      onChoice={(v) => { setJacket({ surgeonsCuffs: v }); goNext() }}
    />
  )
}

export function JacketKissingButtonsStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Bottoni gemelli (kissing)?"
      description="Bottoni sovrapposti uno all'altro."
      value={config.kissingButtons ?? null}
      onChoice={(v) => { setJacket({ kissingButtons: v }); goNext() }}
    />
  )
}

export function JacketTurnbackCuffStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ToggleStep
      question="Polsino aperto (turnback)?"
      description="Polsino piegabile come un risvolto."
      value={config.turnbackCuff ?? null}
      onChoice={(v) => { setJacket({ turnbackCuff: v }); goNext() }}
    />
  )
}

// ─── Vent ────────────────────────────────────────────────────────────────────

const VENTS: ChoiceOption<VentType>[] = [
  { value: 'ventless', label: 'Senza spacchi', description: 'Linea pulita posteriore' },
  { value: 'single', label: 'Spacco singolo', description: 'Centrale, scuola americana' },
  { value: 'double', label: 'Doppio spacco', description: 'Laterali, scuola inglese' },
]

export function JacketVentStep() {
  const { config, setJacket, goNext } = useJacket()
  return (
    <ChoiceStep
      question="Spacco posteriore"
      options={VENTS}
      value={config.vent}
      onChoice={(v) => { setJacket({ vent: v }); goNext() }}
    />
  )
}
