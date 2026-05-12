'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ConfiguratoreState } from '@/types/configuratore'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

interface Props {
  configuration: Record<string, unknown> | null
  fabrics: Fabric[]
  linings: Lining[]
  buttons: ButtonType[]
  threadColors: ThreadColor[]
}

interface SpecSection {
  id: string
  label: string
  preamble?: React.ReactNode
  rows: { label: string; value: string }[]
}

// ── Label maps ────────────────────────────────────────────────────────────────

const CUT_LABELS: Record<string, string> = { slim: 'Slim', fitted: 'Fitted', classic: 'Classic' }
const SCHOOL_LABELS: Record<string, string> = { napoletana: 'Napoletana', milanese: 'Milanese', inglese: 'Inglese', americana: 'Americana' }
const BREAST_LABELS: Record<string, string> = { single: 'Monopetto', double: 'Doppiopetto' }
const SHOULDER_LABELS: Record<string, string> = {
  napoletana_camicia: 'Napoletana a camicia', napoletana_mappina: 'Napoletana a mappina',
  insellata: 'Insellata', roped: 'Roped', padded: 'Con imbottitura',
}
const SLEEVE_LABELS: Record<string, string> = { rollino: 'Rollino', liscia: 'Liscia' }
const LAPEL_TYPE_LABELS: Record<string, string> = { notch: 'Notched', peak: 'Peak', shawl: 'Sciallato' }
const LAPEL_WIDTH_LABELS: Record<string, string> = { narrow: 'Stretto', medium: 'Medio', wide: 'Largo' }
const POCKET_LABELS: Record<string, string> = { flap: 'Con patta', jetted: 'Filettata', patch: 'Patch', slanted: 'Inclinata' }
const BREAST_POCKET_LABELS: Record<string, string> = { straight: 'Dritta', barchetta: 'A barchetta', patch: 'Patch' }
const VENT_LABELS: Record<string, string> = { ventless: 'Senza spacco', single: 'Spacco centrale', double: 'Doppio spacco' }
const HEM_LABELS: Record<string, string> = { squared: 'Squadrata', rounded: 'Arrotondata' }
const LINING_TYPE_LABELS: Record<string, string> = { full: 'Intera', half: 'Mezza fodera', none: 'Sfoderato' }
const PANT_CUT_LABELS: Record<string, string> = { classico: 'Classico', slim: 'Slim', wide_leg: 'Wide leg', carrot: 'Carrot' }
const PANT_WAIST_LABELS: Record<string, string> = { bassa: 'Bassa', media: 'Media', alta: 'Alta' }
const PLEAT_LABELS: Record<string, string> = { flat: 'Senza pinces', single: 'Una pince', double: 'Due pinces' }
const PLEAT_DIR_LABELS: Record<string, string> = { forward: 'In avanti', reverse: "All'indietro" }
const PANT_POCKET_LABELS: Record<string, string> = { americana: 'Americana', francesa: 'Francesa', dritta: 'Dritta' }
const BACK_POCKET_LABELS: Record<string, string> = { jetted: 'Filettata', flap: 'Con patta', button: 'Con bottone' }
const MONOGRAM_POS_LABELS: Record<string, string> = { inner_pocket: 'Tasca interna', inner_lining: 'Fodera interna', cuff: 'Polsino' }
const VEST_LAPEL_LABELS: Record<string, string> = { none: 'Senza risvolto', notch: 'Notched', peak: 'Peak', shawl: 'Sciallato' }
const VEST_BACK_LABELS: Record<string, string> = { fabric: 'Tessuto', satin: 'Raso' }
const CONTRAST_PART_LABELS: Record<string, string> = { lapels: 'Risvolti', cuffs: 'Polsini', back_collar: 'Colletto posteriore' }
const PATTERN_LABELS: Record<string, string> = {
  solid: 'Tinta unita', striped: 'Gessato', checked: 'Quadri', herringbone: 'Spiga',
  houndstooth: 'Pied-de-poule', plaid: 'Tartan', windowpane: 'Principe di Galles',
  paisley: 'Paisley', other: 'Altro',
}

function row(label: string, value: string | null | undefined): { label: string; value: string } | null {
  if (!value) return null
  return { label, value }
}

function rows(...items: (ReturnType<typeof row>)[]): { label: string; value: string }[] {
  return items.filter((r): r is { label: string; value: string } => r !== null)
}

// ── Main component ────────────────────────────────────────────────────────────

export function GarmentSpecSheet({ configuration, fabrics, linings, buttons, threadColors }: Props) {
  const [openId, setOpenId] = useState<string | null>('tessuto')

  if (!configuration) {
    return (
      <div className="px-5 py-6">
        <p className="text-xs italic text-muted-foreground/50">Configurazione non completata.</p>
      </div>
    )
  }

  const cfg = configuration as unknown as Partial<ConfiguratoreState>
  const f = cfg.fabric
  const j = cfg.jacket
  const p = cfg.pant
  const v = cfg.vest ?? null
  const c = cfg.colorContrast

  if (!f?.primaryFabricId && !j?.cut && !p?.cut) {
    return (
      <div className="px-5 py-6">
        <p className="text-xs italic text-muted-foreground/50">Configurazione non completata.</p>
      </div>
    )
  }

  // Resolve catalog IDs → names
  const primaryFabric      = f?.primaryFabricId       ? fabrics.find(x => x.id === f.primaryFabricId)              ?? null : null
  const contrastFabric     = f?.contrastFabricId       ? fabrics.find(x => x.id === f.contrastFabricId)             ?? null : null
  const lining             = c?.liningId               ? linings.find(x => x.id === c.liningId)                     ?? null : null
  const jacketButton       = c?.jacketButtonId         ? buttons.find(x => x.id === c.jacketButtonId)               ?? null : null
  const cuffButton         = c?.cuffButtonId           ? buttons.find(x => x.id === c.cuffButtonId)                 ?? null : null
  const frontButton        = c?.frontButtonId          ? buttons.find(x => x.id === c.frontButtonId)                ?? null : null
  const vestButton         = c?.vestButtonId           ? buttons.find(x => x.id === c.vestButtonId)                 ?? null : null
  const monogramThread     = c?.monogramThreadColorId  ? threadColors.find(x => x.id === c.monogramThreadColorId)   ?? null : null
  const embroideryThread   = c?.embroideryThreadColorId? threadColors.find(x => x.id === c.embroideryThreadColorId) ?? null : null
  const frontBhThread      = c?.frontButtonholeThreadId? threadColors.find(x => x.id === c.frontButtonholeThreadId) ?? null : null
  const sleeveBhThread     = c?.sleeveButtonholeThreadId ? threadColors.find(x => x.id === c.sleeveButtonholeThreadId) ?? null : null
  const jacketContrastFab  = c?.jacketContrastFabricId ? fabrics.find(x => x.id === c.jacketContrastFabricId)       ?? null : null
  const pantContrastFab    = c?.pantContrastFabricId   ? fabrics.find(x => x.id === c.pantContrastFabricId)         ?? null : null

  // ── Build sections ──────────────────────────────────────────────────────────

  const sections: SpecSection[] = []

  // Tessuto
  sections.push({
    id: 'tessuto',
    label: 'Tessuto',
    preamble: primaryFabric ? (
      <p className="font-heading text-xl text-ink leading-tight mb-4">{primaryFabric.name}</p>
    ) : undefined,
    rows: rows(
      row('Brand',            primaryFabric?.mill ?? null),
      row('Composizione',     primaryFabric?.composition ?? null),
      row('Peso',             primaryFabric?.weight_grams ? `${primaryFabric.weight_grams} g/m²` : null),
      row('Armatura',         primaryFabric?.pattern ? (PATTERN_LABELS[primaryFabric.pattern] ?? primaryFabric.pattern) : null),
      row('Colore',           primaryFabric?.color ?? null),
      row('Tessuto contrasto', contrastFabric?.name ?? null),
    ),
  })

  // Giacca
  if (j) {
    const r = rows(
      row('Taglio',    j.cut ? (CUT_LABELS[j.cut] ?? j.cut) : null),
      row('Scuola',    j.school ? (SCHOOL_LABELS[j.school] ?? j.school) : null),
      row('Chiusura',  j.breast ? `${BREAST_LABELS[j.breast]}${j.breast === 'single' && j.singleBreastedButtons ? ` · ${j.singleBreastedButtons} ${j.singleBreastedButtons === 1 ? 'bottone' : 'bottoni'}` : j.breast === 'double' && j.doubleBreastedConfig ? ` · ${j.doubleBreastedConfig}` : ''}` : null),
      row('Spalla',    j.shoulder ? (SHOULDER_LABELS[j.shoulder] ?? j.shoulder) : null),
      row('Manica',    j.sleeve ? (SLEEVE_LABELS[j.sleeve] ?? j.sleeve) : null),
      row('Bavero',    j.lapelType ? `${LAPEL_TYPE_LABELS[j.lapelType] ?? j.lapelType}${j.lapelWidthCm ? ` · ${j.lapelWidthCm} cm` : j.lapelWidth ? ` · ${LAPEL_WIDTH_LABELS[j.lapelWidth] ?? j.lapelWidth}` : ''}` : null),
      row('Orlo',      j.hemShape ? (HEM_LABELS[j.hemShape] ?? j.hemShape) : null),
      row('Correzione lunghezza', j.lengthOffset && j.lengthOffset !== 0 ? `${j.lengthOffset > 0 ? '+' : ''}${j.lengthOffset} cm` : null),
      row('Tasche laterali', j.sidePocket ? (POCKET_LABELS[j.sidePocket] ?? j.sidePocket) : null),
      row('Tasca petto', j.breastPocket ? (BREAST_POCKET_LABELS[j.breastPocket] ?? j.breastPocket) : null),
      row('Ticket pocket', j.ticketPocket ? 'Sì' : null),
      row('Bottoni manica', j.sleeveButtonCount != null ? [String(j.sleeveButtonCount), j.kissingButtons ? 'a bacio' : null, j.surgeonsCuffs ? 'polsino chirurgo' : null, j.turnbackCuff ? 'turnback' : null].filter(Boolean).join(' · ') : null),
      row('Spacco',    j.vent ? (VENT_LABELS[j.vent] ?? j.vent) : null),
      row('Asola bavero',   j.lapelButtonhole ? 'Sì' : null),
      row('Stab stitching', j.stabStitching   ? 'Sì' : null),
      row('Piping bavero',  j.lapelPiping     ? 'Sì' : null),
    )
    if (r.length) sections.push({ id: 'giacca', label: 'Giacca', rows: r })
  }

  // Pantalone
  if (p) {
    const r = rows(
      row('Taglio',   p.cut   ? (PANT_CUT_LABELS[p.cut]   ?? p.cut)   : null),
      row('Vita',     p.waist ? (PANT_WAIST_LABELS[p.waist] ?? p.waist) : null),
      row('Pinces',   p.pleat ? `${PLEAT_LABELS[p.pleat] ?? p.pleat}${p.pleat !== 'flat' && p.pleatDirection ? ` · ${PLEAT_DIR_LABELS[p.pleatDirection] ?? p.pleatDirection}` : ''}` : null),
      row('Tasche laterali',   p.sidePocket ? (PANT_POCKET_LABELS[p.sidePocket] ?? p.sidePocket) : null),
      row('Tasche posteriori', p.backPocketCount && p.backPocketCount > 0 ? [String(p.backPocketCount), p.backPocketType ? (BACK_POCKET_LABELS[p.backPocketType] ?? p.backPocketType) : null, p.backPocketButton ? 'con bottone' : null].filter(Boolean).join(' · ') : null),
      row('Risvolto',          p.cuff && p.cuffHeight != null ? `${p.cuffHeight} cm` : null),
      row('Bottoni bretelle',  p.suspenderButtons ? 'Sì' : null),
      row('Regolatori laterali', !p.beltLoops && p.sideAdjusters ? 'Sì' : null),
      row('Passanti cintura',  p.beltLoops && p.beltLoopCount != null ? String(p.beltLoopCount) : null),
    )
    if (r.length) sections.push({ id: 'pantalone', label: 'Pantalone', rows: r })
  }

  // Gilet
  if (v) {
    const r = rows(
      row('Chiusura',           v.breast      ? (BREAST_LABELS[v.breast]         ?? v.breast)      : null),
      row('Risvolto',           v.lapel       ? (VEST_LAPEL_LABELS[v.lapel]      ?? v.lapel)       : null),
      row('Bottoni',            v.buttonCount != null ? String(v.buttonCount)                       : null),
      row('Tasche',             v.pocketCount != null ? String(v.pocketCount)                       : null),
      row('Dorso',              v.backMaterial ? (VEST_BACK_LABELS[v.backMaterial] ?? v.backMaterial) : null),
      row('Cintura posteriore', v.backBelt    ? 'Sì'                                               : null),
    )
    if (r.length) sections.push({ id: 'gilet', label: 'Gilet', rows: r })
  }

  // Fodera & Dettagli
  if (c) {
    const r = rows(
      row('Fodera',             c.liningType ? [lining?.name, LINING_TYPE_LABELS[c.liningType] ?? c.liningType].filter(Boolean).join(' · ') : null),
      row('Flash lining',       c.flashLining ? 'Sì' : null),
      row('Contrasto giacca',   c.jacketContrastEnabled && jacketContrastFab ? [jacketContrastFab.name, c.jacketContrastParts?.length ? c.jacketContrastParts.map(pt => CONTRAST_PART_LABELS[pt] ?? pt).join(', ') : null].filter(Boolean).join(' · ') : null),
      row('Contrasto pantalone',c.pantContrastEnabled && pantContrastFab ? pantContrastFab.name : null),
      row('Piping',             c.pipingEnabled && c.pipingColor ? c.pipingColor : null),
      row('Colletto posteriore',c.backCollarContrast && c.backCollarColor ? c.backCollarColor : null),
      row('Ricamo',             c.embroideryText ? [c.embroideryText, embroideryThread?.name].filter(Boolean).join(' · ') : null),
      row('Bottoni giacca',     jacketButton?.name ?? null),
      row('Bottoni polsino',    cuffButton && cuffButton.id !== jacketButton?.id ? cuffButton.name : null),
      row('Bottoni fronte',     frontButton?.name ?? null),
      row('Bottoni gilet',      vestButton?.name ?? null),
      row('Filo asole fronte',  frontBhThread?.name ?? null),
      row('Filo asole manica',  sleeveBhThread && sleeveBhThread.id !== frontBhThread?.id ? sleeveBhThread.name : null),
      row('Monogramma',         c.monogramEnabled && c.monogramText ? [c.monogramText, c.monogramPosition ? (MONOGRAM_POS_LABELS[c.monogramPosition] ?? c.monogramPosition) : null, monogramThread?.name].filter(Boolean).join(' · ') : null),
    )
    if (r.length) sections.push({ id: 'dettagli', label: 'Fodera & Dettagli', rows: r })
  }

  if (!sections.length) {
    return (
      <div className="px-5 py-6">
        <p className="text-xs italic text-muted-foreground/50">Configurazione non completata.</p>
      </div>
    )
  }

  return (
    <div>
      {sections.map((section) => {
        const isOpen = openId === section.id
        return (
          <AccordionSection
            key={section.id}
            label={section.label}
            isOpen={isOpen}
            onToggle={() => setOpenId(isOpen ? null : section.id)}
          >
            {section.preamble}
            {section.rows.length > 0 && (
              <dl className="space-y-2">
                {section.rows.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-8"
                  >
                    <dt className="text-xs text-muted-foreground shrink-0">{r.label}</dt>
                    <dd className="text-sm text-foreground text-right">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </AccordionSection>
        )
      })}
    </div>
  )
}

// ── Accordion section ─────────────────────────────────────────────────────────

function AccordionSection({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>

      {/* Smooth CSS-grid accordion — animates gridTemplateRows 0fr → 1fr */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-5 pb-5 pt-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
