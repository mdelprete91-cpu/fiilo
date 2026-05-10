'use client'

import { useConfiguratoreStore } from '@/lib/configuratore/store'
import type { JacketContrastPart, MonogramPosition } from '@/types/configuratore'

import { useCatalog } from '../CatalogContext'
import { ChoiceStep, type ChoiceOption } from './atoms/ChoiceStep'
import { MultiChoiceStep, type MultiChoiceOption } from './atoms/MultiChoiceStep'
import { TextStep } from './atoms/TextStep'
import { ToggleStep } from './atoms/ToggleStep'

function useColor() {
  return {
    config: useConfiguratoreStore((s) => s.config.colorContrast),
    setColor: useConfiguratoreStore((s) => s.setColor),
    goNext: useConfiguratoreStore((s) => s.goNext),
  }
}

// ─── Jacket contrast ─────────────────────────────────────────────────────────

export function JacketContrastEnabledStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Contrasto sulla giacca?"
      description="Es. bavero, polsi o colletto in tessuto diverso."
      value={config.jacketContrastEnabled ?? null}
      onChoice={(v) => {
        setColor({
          jacketContrastEnabled: v,
          jacketContrastFabricId: v ? config.jacketContrastFabricId : null,
          jacketContrastParts: v ? config.jacketContrastParts : [],
        })
        goNext()
      }}
    />
  )
}

export function JacketContrastFabricStep() {
  const { config, setColor, goNext } = useColor()
  const { fabrics } = useCatalog()
  const options: ChoiceOption<string>[] = fabrics.map((f) => ({
    value: f.id,
    label: f.name,
    description: f.composition ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Quale tessuto in contrasto?"
      options={options}
      value={config.jacketContrastFabricId}
      onChoice={(v) => { setColor({ jacketContrastFabricId: v }); goNext() }}
      layout="grid"
    />
  )
}

const CONTRAST_PARTS: MultiChoiceOption<JacketContrastPart>[] = [
  { value: 'lapels', label: 'Bavero' },
  { value: 'cuffs', label: 'Polsini' },
  { value: 'back_collar', label: 'Colletto posteriore' },
]

export function JacketContrastPartsStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <MultiChoiceStep<JacketContrastPart>
      question="Quali parti in contrasto?"
      description="Seleziona una o più parti, poi clicca Avanti."
      options={CONTRAST_PARTS}
      value={config.jacketContrastParts}
      onChange={(v) => setColor({ jacketContrastParts: v })}
      onConfirm={goNext}
      allowEmpty={false}
    />
  )
}

// ─── Pant contrast ───────────────────────────────────────────────────────────

export function PantContrastEnabledStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Contrasto sul pantalone?"
      value={config.pantContrastEnabled ?? null}
      onChoice={(v) => {
        setColor({
          pantContrastEnabled: v,
          pantContrastFabricId: v ? config.pantContrastFabricId : null,
        })
        goNext()
      }}
    />
  )
}

export function PantContrastFabricStep() {
  const { config, setColor, goNext } = useColor()
  const { fabrics } = useCatalog()
  const options: ChoiceOption<string>[] = fabrics.map((f) => ({
    value: f.id,
    label: f.name,
    description: f.composition ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Tessuto in contrasto pantalone"
      options={options}
      value={config.pantContrastFabricId}
      onChoice={(v) => { setColor({ pantContrastFabricId: v }); goNext() }}
      layout="grid"
    />
  )
}

// ─── Lining ──────────────────────────────────────────────────────────────────

const LINING_TYPES: ChoiceOption<'full' | 'half' | 'none'>[] = [
  { value: 'full', label: 'Foderata interamente', description: 'Foderata davanti e dietro' },
  { value: 'half', label: 'Mezza foderata', description: 'Tipica scuola napoletana, fresca d\'estate' },
  { value: 'none', label: 'Sfoderata', description: 'Massima leggerezza, costruzione visibile' },
]

export function LiningTypeStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ChoiceStep<'full' | 'half' | 'none'>
      question="Tipo di fodera"
      options={LINING_TYPES}
      value={config.liningType}
      onChoice={(v) => {
        setColor({
          liningType: v,
          liningId: v === 'none' ? null : config.liningId,
        })
        goNext()
      }}
    />
  )
}

export function LiningFabricStep() {
  const { config, setColor, goNext } = useColor()
  const { linings } = useCatalog()
  const options: ChoiceOption<string>[] = linings.map((l) => ({
    value: l.id,
    label: l.name,
    description: l.color ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Scegli la fodera"
      options={options}
      value={config.liningId}
      onChoice={(v) => { setColor({ liningId: v }); goNext() }}
      layout={options.length > 4 ? 'grid' : 'list'}
    />
  )
}

export function FlashLiningStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Flash lining (fodera lampo) all'interno?"
      description="Fodera con fantasia decorativa visibile aprendo la giacca."
      value={config.flashLining ?? null}
      onChoice={(v) => { setColor({ flashLining: v }); goNext() }}
    />
  )
}

// ─── Piping ──────────────────────────────────────────────────────────────────

export function PipingEnabledStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Profili decorativi?"
      description="Cordoncino o filettatura lungo i bordi (es. taschino, manica)."
      value={config.pipingEnabled ?? null}
      onChoice={(v) => {
        setColor({
          pipingEnabled: v,
          pipingColor: v ? config.pipingColor : null,
        })
        goNext()
      }}
    />
  )
}

export function PipingColorStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <TextStep
      question="Colore del profilo"
      description="Es. bianco, oro, bordeaux."
      value={config.pipingColor}
      onChange={(v) => setColor({ pipingColor: v })}
      onConfirm={goNext}
      placeholder="bordeaux"
      required
    />
  )
}

// ─── Back collar ─────────────────────────────────────────────────────────────

export function BackCollarContrastStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Sotto-colletto in contrasto?"
      description="Visibile con il colletto rialzato."
      value={config.backCollarContrast ?? null}
      onChoice={(v) => {
        setColor({
          backCollarContrast: v,
          backCollarColor: v ? config.backCollarColor : null,
          embroideryText: v ? config.embroideryText : null,
        })
        goNext()
      }}
    />
  )
}

export function BackCollarColorStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <TextStep
      question="Colore del sotto-colletto"
      value={config.backCollarColor}
      onChange={(v) => setColor({ backCollarColor: v })}
      onConfirm={goNext}
      placeholder="es. verde bottiglia"
      required
    />
  )
}

export function EmbroideryTextStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <TextStep
      question="Ricamo sul sotto-colletto"
      description="Lascia vuoto per saltare. Testo opzionale, max 24 caratteri."
      value={config.embroideryText}
      onChange={(v) => setColor({ embroideryText: v })}
      onConfirm={goNext}
      placeholder="es. iniziali"
      maxLength={24}
    />
  )
}

export function EmbroideryThreadStep() {
  const { config, setColor, goNext } = useColor()
  const { threadColors } = useCatalog()
  const options: ChoiceOption<string>[] = threadColors.map((t) => ({
    value: t.id,
    label: t.name,
    description: t.hex_color,
  }))
  return (
    <ChoiceStep<string>
      question="Filo per il ricamo"
      options={options}
      value={config.embroideryThreadColorId}
      onChoice={(v) => { setColor({ embroideryThreadColorId: v }); goNext() }}
      layout="grid"
    />
  )
}

// ─── Buttonhole thread ───────────────────────────────────────────────────────

export function FrontButtonholeThreadStep() {
  const { config, setColor, goNext } = useColor()
  const { threadColors } = useCatalog()
  const options: ChoiceOption<string>[] = threadColors.map((t) => ({
    value: t.id,
    label: t.name,
    description: t.hex_color,
  }))
  return (
    <ChoiceStep<string>
      question="Filo asole davanti giacca"
      options={options}
      value={config.frontButtonholeThreadId}
      onChoice={(v) => { setColor({ frontButtonholeThreadId: v }); goNext() }}
      layout="grid"
    />
  )
}

export function SleeveButtonholeThreadStep() {
  const { config, setColor, goNext } = useColor()
  const { threadColors } = useCatalog()
  const options: ChoiceOption<string>[] = threadColors.map((t) => ({
    value: t.id,
    label: t.name,
    description: t.hex_color,
  }))
  return (
    <ChoiceStep<string>
      question="Filo asole sulle maniche"
      options={options}
      value={config.sleeveButtonholeThreadId}
      onChoice={(v) => { setColor({ sleeveButtonholeThreadId: v }); goNext() }}
      layout="grid"
    />
  )
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function JacketButtonStep() {
  const { config, setColor, goNext } = useColor()
  const { buttons } = useCatalog()
  const options: ChoiceOption<string>[] = buttons.map((b) => ({
    value: b.id,
    label: b.name,
    description: b.material ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Bottoni davanti giacca"
      options={options}
      value={config.jacketButtonId}
      onChoice={(v) => { setColor({ jacketButtonId: v }); goNext() }}
      layout="grid"
    />
  )
}

export function CuffButtonStep() {
  const { config, setColor, goNext } = useColor()
  const { buttons } = useCatalog()
  const options: ChoiceOption<string>[] = buttons.map((b) => ({
    value: b.id,
    label: b.name,
    description: b.material ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Bottoni del polsino"
      description="Possono essere uguali o diversi da quelli davanti."
      options={options}
      value={config.cuffButtonId}
      onChoice={(v) => { setColor({ cuffButtonId: v }); goNext() }}
      layout="grid"
    />
  )
}

export function FrontButtonStep() {
  const { config, setColor, goNext } = useColor()
  const { buttons } = useCatalog()
  const options: ChoiceOption<string>[] = buttons.map((b) => ({
    value: b.id,
    label: b.name,
    description: b.material ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Bottone chiusura pantalone"
      options={options}
      value={config.frontButtonId}
      onChoice={(v) => { setColor({ frontButtonId: v }); goNext() }}
      layout="grid"
    />
  )
}

export function VestButtonStep() {
  const { config, setColor, goNext } = useColor()
  const { buttons } = useCatalog()
  const options: ChoiceOption<string>[] = buttons.map((b) => ({
    value: b.id,
    label: b.name,
    description: b.material ?? undefined,
  }))
  return (
    <ChoiceStep<string>
      question="Bottoni del gilet"
      options={options}
      value={config.vestButtonId}
      onChoice={(v) => { setColor({ vestButtonId: v }); goNext() }}
      layout="grid"
    />
  )
}

// ─── Monogram ────────────────────────────────────────────────────────────────

export function MonogramEnabledStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ToggleStep
      question="Monogramma personalizzato?"
      description="Iniziali ricamate sulla fodera o sui polsi."
      value={config.monogramEnabled ?? null}
      onChoice={(v) => {
        setColor({
          monogramEnabled: v,
          monogramText: v ? config.monogramText : null,
          monogramThreadColorId: v ? config.monogramThreadColorId : null,
          monogramPosition: v ? config.monogramPosition : null,
        })
        goNext()
      }}
    />
  )
}

export function MonogramTextStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <TextStep
      question="Testo del monogramma"
      description="Massimo 4 caratteri."
      value={config.monogramText}
      onChange={(v) => setColor({ monogramText: v?.toUpperCase() ?? null })}
      onConfirm={goNext}
      placeholder="MS"
      maxLength={4}
      required
    />
  )
}

export function MonogramThreadStep() {
  const { config, setColor, goNext } = useColor()
  const { threadColors } = useCatalog()
  const options: ChoiceOption<string>[] = threadColors.map((t) => ({
    value: t.id,
    label: t.name,
    description: t.hex_color,
  }))
  return (
    <ChoiceStep<string>
      question="Colore del filo"
      options={options}
      value={config.monogramThreadColorId}
      onChoice={(v) => { setColor({ monogramThreadColorId: v }); goNext() }}
      layout="grid"
    />
  )
}

const MONOGRAM_POSITIONS: ChoiceOption<MonogramPosition>[] = [
  { value: 'inner_pocket', label: 'Tasca interna', description: 'Sopra la tasca interna sinistra' },
  { value: 'inner_lining', label: 'Fodera centrale', description: 'Centro della fodera, ben visibile' },
  { value: 'cuff', label: 'Polsino sinistro', description: 'Vicino ai bottoni della manica' },
]

export function MonogramPositionStep() {
  const { config, setColor, goNext } = useColor()
  return (
    <ChoiceStep
      question="Posizione del monogramma"
      options={MONOGRAM_POSITIONS}
      value={config.monogramPosition}
      onChoice={(v) => { setColor({ monogramPosition: v }); goNext() }}
    />
  )
}
