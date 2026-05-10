import type {
  ConfigStep,
  ConfiguratoreState,
  StepContext,
  StepDef,
} from '@/types/configuratore'

/**
 * Garment-type predicates — derive presence of jacket / pant / vest sections.
 *
 * - jacket: anything two-piece, three-piece, jacket-only, tuxedo, coat
 * - pant: anything with trousers (suits, trousers-only, tuxedo)
 * - vest: three-piece, waistcoat-only, tuxedo (typically waistcoated)
 */
export function hasJacket(state: ConfiguratoreState): boolean {
  const t = state.garmentType
  if (!t) return false
  return t === 'suit_2pc' || t === 'suit_3pc' || t === 'jacket' || t === 'tuxedo' || t === 'coat'
}

export function hasPant(state: ConfiguratoreState): boolean {
  const t = state.garmentType
  if (!t) return false
  return t === 'suit_2pc' || t === 'suit_3pc' || t === 'trousers' || t === 'tuxedo'
}

export function hasVest(state: ConfiguratoreState): boolean {
  const t = state.garmentType
  if (!t) return false
  return t === 'suit_3pc' || t === 'waistcoat' || t === 'tuxedo'
}

/**
 * Declarative list of every atomic step in display order.
 * Rendering and navigation derive from this list — never hardcode order elsewhere.
 */
export const STEPS: StepDef[] = [
  // ─── Setup ─────────────────────────────────────────────────────────────────
  { id: 'setup.type', label: 'Tipo di capo', section: 'setup' },
  {
    id: 'setup.measurements',
    label: 'Misure cliente',
    section: 'setup',
    condition: (_s, ctx) => ctx.measurementsCount === 0,
  },

  // ─── Fabric ────────────────────────────────────────────────────────────────
  { id: 'fabric.primary', label: 'Tessuto principale', section: 'fabric' },
  { id: 'fabric.contrast', label: 'Tessuto contrasto', section: 'fabric' },

  // ─── Jacket ────────────────────────────────────────────────────────────────
  { id: 'jacket.cut', label: 'Taglio giacca', section: 'jacket', condition: hasJacket },
  { id: 'jacket.school', label: 'Scuola sartoriale', section: 'jacket', condition: hasJacket },
  { id: 'jacket.breast', label: 'Petto', section: 'jacket', condition: hasJacket },
  {
    id: 'jacket.single_buttons',
    label: 'Bottoni (single-breasted)',
    section: 'jacket',
    condition: (s) => hasJacket(s) && s.jacket.breast === 'single',
  },
  {
    id: 'jacket.double_config',
    label: 'Configurazione doppiopetto',
    section: 'jacket',
    condition: (s) => hasJacket(s) && s.jacket.breast === 'double',
  },
  { id: 'jacket.shoulder', label: 'Spalla', section: 'jacket', condition: hasJacket },
  { id: 'jacket.sleeve', label: 'Manica', section: 'jacket', condition: hasJacket },
  { id: 'jacket.lapel_type', label: 'Tipo bavero', section: 'jacket', condition: hasJacket },
  { id: 'jacket.lapel_width', label: 'Larghezza bavero', section: 'jacket', condition: hasJacket },
  { id: 'jacket.lapel_buttonhole', label: 'Asola bavero', section: 'jacket', condition: hasJacket },
  { id: 'jacket.stab_stitching', label: 'Impuntura', section: 'jacket', condition: hasJacket },
  { id: 'jacket.lapel_piping', label: 'Profilo bavero', section: 'jacket', condition: hasJacket },
  { id: 'jacket.hem_shape', label: 'Forma fondo', section: 'jacket', condition: hasJacket },
  { id: 'jacket.length_offset', label: 'Lunghezza', section: 'jacket', condition: hasJacket },
  { id: 'jacket.side_pocket', label: 'Tasche laterali', section: 'jacket', condition: hasJacket },
  { id: 'jacket.breast_pocket', label: 'Taschino petto', section: 'jacket', condition: hasJacket },
  { id: 'jacket.ticket_pocket', label: 'Taschino ticket', section: 'jacket', condition: hasJacket },
  { id: 'jacket.sleeve_button_count', label: 'Bottoni manica', section: 'jacket', condition: hasJacket },
  { id: 'jacket.surgeons_cuffs', label: 'Bottoni lavorati', section: 'jacket', condition: hasJacket },
  { id: 'jacket.kissing_buttons', label: 'Bottoni gemelli', section: 'jacket', condition: hasJacket },
  { id: 'jacket.turnback_cuff', label: 'Polsino aperto', section: 'jacket', condition: hasJacket },
  { id: 'jacket.vent', label: 'Spacco', section: 'jacket', condition: hasJacket },

  // ─── Pant ──────────────────────────────────────────────────────────────────
  { id: 'pant.cut', label: 'Taglio pantalone', section: 'pant', condition: hasPant },
  { id: 'pant.waist', label: 'Vita', section: 'pant', condition: hasPant },
  { id: 'pant.suspender_buttons', label: 'Bottoni bretelle', section: 'pant', condition: hasPant },
  { id: 'pant.pleat', label: 'Pinces', section: 'pant', condition: hasPant },
  {
    id: 'pant.pleat_direction',
    label: 'Direzione pinces',
    section: 'pant',
    condition: (s) => hasPant(s) && s.pant.pleat !== null && s.pant.pleat !== 'flat',
  },
  { id: 'pant.side_pocket', label: 'Tasche laterali', section: 'pant', condition: hasPant },
  { id: 'pant.back_pocket_count', label: 'Numero tasche posteriori', section: 'pant', condition: hasPant },
  {
    id: 'pant.back_pocket_type',
    label: 'Tipo tasche posteriori',
    section: 'pant',
    condition: (s) => hasPant(s) && (s.pant.backPocketCount ?? 0) > 0,
  },
  {
    id: 'pant.back_pocket_button',
    label: 'Bottone tasche posteriori',
    section: 'pant',
    condition: (s) => hasPant(s) && (s.pant.backPocketCount ?? 0) > 0,
  },
  { id: 'pant.belt_loops', label: 'Passanti cintura', section: 'pant', condition: hasPant },
  {
    id: 'pant.belt_loop_count',
    label: 'Numero passanti',
    section: 'pant',
    condition: (s) => hasPant(s) && s.pant.beltLoops,
  },
  { id: 'pant.side_adjusters', label: 'Tiretti laterali', section: 'pant', condition: hasPant },
  { id: 'pant.cuff', label: 'Risvolto', section: 'pant', condition: hasPant },
  {
    id: 'pant.cuff_height',
    label: 'Altezza risvolto',
    section: 'pant',
    condition: (s) => hasPant(s) && s.pant.cuff,
  },

  // ─── Vest ──────────────────────────────────────────────────────────────────
  { id: 'vest.breast', label: 'Petto gilet', section: 'vest', condition: hasVest },
  { id: 'vest.lapel', label: 'Bavero gilet', section: 'vest', condition: hasVest },
  { id: 'vest.button_count', label: 'Bottoni gilet', section: 'vest', condition: hasVest },
  { id: 'vest.back_material', label: 'Schiena gilet', section: 'vest', condition: hasVest },
  { id: 'vest.pockets', label: 'Tasche gilet', section: 'vest', condition: hasVest },
  { id: 'vest.back_belt', label: 'Cinturino dietro', section: 'vest', condition: hasVest },

  // ─── Color & details ──────────────────────────────────────────────────────
  {
    id: 'color.jacket_contrast_enabled',
    label: 'Contrasto giacca',
    section: 'color',
    condition: hasJacket,
  },
  {
    id: 'color.jacket_contrast_fabric',
    label: 'Tessuto contrasto giacca',
    section: 'color',
    condition: (s) => hasJacket(s) && s.colorContrast.jacketContrastEnabled,
  },
  {
    id: 'color.jacket_contrast_parts',
    label: 'Parti in contrasto',
    section: 'color',
    condition: (s) => hasJacket(s) && s.colorContrast.jacketContrastEnabled,
  },
  {
    id: 'color.pant_contrast_enabled',
    label: 'Contrasto pantalone',
    section: 'color',
    condition: hasPant,
  },
  {
    id: 'color.pant_contrast_fabric',
    label: 'Tessuto contrasto pantalone',
    section: 'color',
    condition: (s) => hasPant(s) && s.colorContrast.pantContrastEnabled,
  },
  {
    id: 'color.lining_type',
    label: 'Tipo fodera',
    section: 'color',
    condition: hasJacket,
  },
  {
    id: 'color.lining_fabric',
    label: 'Fodera',
    section: 'color',
    condition: (s) =>
      hasJacket(s) && s.colorContrast.liningType !== null && s.colorContrast.liningType !== 'none',
  },
  {
    id: 'color.flash_lining',
    label: 'Flash lining',
    section: 'color',
    condition: (s) => hasJacket(s) && s.colorContrast.liningType !== null && s.colorContrast.liningType !== 'none',
  },
  { id: 'color.piping_enabled', label: 'Profilo', section: 'color' },
  {
    id: 'color.piping_color',
    label: 'Colore profilo',
    section: 'color',
    condition: (s) => s.colorContrast.pipingEnabled,
  },
  {
    id: 'color.back_collar_contrast',
    label: 'Colletto posteriore',
    section: 'color',
    condition: hasJacket,
  },
  {
    id: 'color.back_collar_color',
    label: 'Colore colletto posteriore',
    section: 'color',
    condition: (s) => hasJacket(s) && s.colorContrast.backCollarContrast,
  },
  {
    id: 'color.embroidery_text',
    label: 'Ricamo',
    section: 'color',
    condition: (s) => hasJacket(s) && s.colorContrast.backCollarContrast,
  },
  {
    id: 'color.embroidery_thread',
    label: 'Filo ricamo',
    section: 'color',
    condition: (s) =>
      hasJacket(s) &&
      s.colorContrast.backCollarContrast &&
      !!s.colorContrast.embroideryText &&
      s.colorContrast.embroideryText.length > 0,
  },
  {
    id: 'color.front_buttonhole_thread',
    label: 'Filo asole giacca',
    section: 'color',
    condition: hasJacket,
  },
  {
    id: 'color.sleeve_buttonhole_thread',
    label: 'Filo asole manica',
    section: 'color',
    condition: hasJacket,
  },
  { id: 'color.jacket_button', label: 'Bottone giacca', section: 'color', condition: hasJacket },
  { id: 'color.cuff_button', label: 'Bottone polsino', section: 'color', condition: hasJacket },
  { id: 'color.front_button', label: 'Bottone frontale', section: 'color', condition: hasPant },
  { id: 'color.vest_button', label: 'Bottone gilet', section: 'color', condition: hasVest },
  { id: 'color.monogram_enabled', label: 'Monogramma', section: 'color' },
  {
    id: 'color.monogram_text',
    label: 'Testo monogramma',
    section: 'color',
    condition: (s) => s.colorContrast.monogramEnabled,
  },
  {
    id: 'color.monogram_thread',
    label: 'Filo monogramma',
    section: 'color',
    condition: (s) => s.colorContrast.monogramEnabled,
  },
  {
    id: 'color.monogram_position',
    label: 'Posizione monogramma',
    section: 'color',
    condition: (s) => s.colorContrast.monogramEnabled,
  },

  // ─── Final ─────────────────────────────────────────────────────────────────
  { id: 'review', label: 'Riepilogo & conferma', section: 'review' },
]

const STEP_BY_ID: Map<ConfigStep, StepDef> = new Map(STEPS.map((s) => [s.id, s]))

export function getStep(id: ConfigStep): StepDef | undefined {
  return STEP_BY_ID.get(id)
}

/**
 * Compute the steps visible given current state + context (e.g. measurements count).
 * The returned array preserves the order in STEPS.
 */
export function getVisibleSteps(state: ConfiguratoreState, ctx: StepContext): StepDef[] {
  return STEPS.filter((s) => (s.condition ? s.condition(state, ctx) : true))
}

/**
 * Find the next visible step after `current`. Returns null at the end.
 *
 * Handles the case where `current` itself is no longer in the visible list —
 * which happens when an action mutates state in a way that hides the current
 * step (e.g. saving the first measurement removes setup.measurements from the
 * funnel). In that case we fall back to the master STEPS order: locate the
 * current step's master index and return the first visible step after it.
 */
export function nextStep(
  current: ConfigStep,
  state: ConfiguratoreState,
  ctx: StepContext,
): ConfigStep | null {
  const visible = getVisibleSteps(state, ctx)
  const i = visible.findIndex((s) => s.id === current)
  if (i !== -1) return i === visible.length - 1 ? null : visible[i + 1].id

  const masterIdx = STEPS.findIndex((s) => s.id === current)
  if (masterIdx === -1) return visible[0]?.id ?? null
  const visibleIds = new Set(visible.map((s) => s.id))
  for (let j = masterIdx + 1; j < STEPS.length; j++) {
    if (visibleIds.has(STEPS[j].id)) return STEPS[j].id
  }
  return null
}

export function prevStep(
  current: ConfigStep,
  state: ConfiguratoreState,
  ctx: StepContext,
): ConfigStep | null {
  const visible = getVisibleSteps(state, ctx)
  const i = visible.findIndex((s) => s.id === current)
  if (i !== -1) return i <= 0 ? null : visible[i - 1].id

  const masterIdx = STEPS.findIndex((s) => s.id === current)
  if (masterIdx === -1) return visible[visible.length - 1]?.id ?? null
  const visibleIds = new Set(visible.map((s) => s.id))
  for (let j = masterIdx - 1; j >= 0; j--) {
    if (visibleIds.has(STEPS[j].id)) return STEPS[j].id
  }
  return null
}

/**
 * Map legacy macro-step IDs (saved on existing draft garments) to the first
 * atomic step of the corresponding section. Used on hydrate so old drafts open
 * at a sensible position instead of a non-existent step.
 */
export const LEGACY_STEP_MAP: Record<string, ConfigStep> = {
  fabric: 'fabric.primary',
  'jacket.style': 'jacket.cut',
  'jacket.lapel': 'jacket.lapel_type',
  'jacket.bottom': 'jacket.hem_shape',
  'jacket.pockets': 'jacket.side_pocket',
  'jacket.sleeve_buttons': 'jacket.sleeve_button_count',
  'jacket.vent': 'jacket.vent',
  'pant.style': 'pant.cut',
  'pant.pleat': 'pant.pleat',
  'pant.pockets': 'pant.side_pocket',
  'pant.back_pockets': 'pant.back_pocket_count',
  'pant.belt_loops': 'pant.belt_loops',
  'pant.cuffs': 'pant.cuff',
  'vest.style': 'vest.breast',
  'color.jacket_contrast': 'color.jacket_contrast_enabled',
  'color.pant_contrast': 'color.pant_contrast_enabled',
  'color.lining': 'color.lining_type',
  'color.piping': 'color.piping_enabled',
  'color.back_collar': 'color.back_collar_contrast',
  'color.buttonhole_thread': 'color.front_buttonhole_thread',
  'color.buttons': 'color.jacket_button',
  'color.monogram': 'color.monogram_enabled',
  measurements: 'setup.measurements',
  review: 'review',
}

/**
 * Resolve a step ID coming from the database. If it's already a valid atomic
 * step return it, otherwise translate from the legacy schema.
 */
export function resolveLegacyStep(raw: string): ConfigStep {
  if (STEP_BY_ID.has(raw as ConfigStep)) return raw as ConfigStep
  return LEGACY_STEP_MAP[raw] ?? 'setup.type'
}

/**
 * Section ordering used to build the sidebar groups.
 */
export const SECTION_ORDER: Array<{
  id: 'setup' | 'fabric' | 'jacket' | 'pant' | 'vest' | 'color' | 'review'
  label: string
}> = [
  { id: 'setup', label: 'Setup' },
  { id: 'fabric', label: 'Tessuto' },
  { id: 'jacket', label: 'Giacca' },
  { id: 'pant', label: 'Pantalone' },
  { id: 'vest', label: 'Gilet' },
  { id: 'color', label: 'Contrasti & dettagli' },
  { id: 'review', label: 'Riepilogo' },
]
