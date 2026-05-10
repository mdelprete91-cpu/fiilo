import type { GarmentType } from './database'

// ─── Configuratore: struttura dello stato completo ───────────────────────────

export interface ConfiguratoreState {
  garmentType: GarmentType | null
  fabric: FabricConfig
  jacket: JacketConfig
  pant: PantConfig
  vest: VestConfig | null
  colorContrast: ColorContrastConfig
  measurementId: string | null
}

// ─── FABRIC ──────────────────────────────────────────────────────────────────

export interface FabricConfig {
  primaryFabricId: string | null
  contrastFabricId: string | null
}

// ─── JACKET ──────────────────────────────────────────────────────────────────

export type JacketCut = 'slim' | 'fitted' | 'classic'
export type SartorialSchool = 'napoletana' | 'milanese' | 'inglese' | 'americana'
export type BreastType = 'single' | 'double'
export type ShoulderType = 'napoletana_camicia' | 'napoletana_mappina' | 'insellata' | 'roped' | 'padded'
export type SleeveType = 'rollino' | 'liscia'
export type LapelType = 'notch' | 'peak' | 'shawl'
export type LapelWidth = 'narrow' | 'medium' | 'wide'
export type PocketType = 'flap' | 'jetted' | 'patch' | 'slanted'
export type BreastPocketType = 'straight' | 'barchetta' | 'patch'
export type VentType = 'ventless' | 'single' | 'double'
export type SingleBreastedButtons = 1 | 2 | 3
export type DoubleBreastedConfig = '6x2' | '6x1' | '4x2' | '4x1'

export interface JacketConfig {
  // Style
  cut: JacketCut | null
  school: SartorialSchool | null
  breast: BreastType | null
  singleBreastedButtons: SingleBreastedButtons | null
  doubleBreastedConfig: DoubleBreastedConfig | null
  shoulder: ShoulderType | null
  sleeve: SleeveType | null
  // Lapel
  lapelType: LapelType | null
  lapelWidth: LapelWidth | null
  lapelWidthCm: number | null
  lapelButtonhole: boolean
  stabStitching: boolean
  lapelPiping: boolean
  // Bottom
  hemShape: 'squared' | 'rounded' | null
  lengthOffset: number
  // Pockets
  sidePocket: PocketType | null
  breastPocket: BreastPocketType | null
  ticketPocket: boolean
  // Sleeve buttons
  sleeveButtonCount: 2 | 3 | 4 | null
  surgeonsCuffs: boolean
  kissingButtons: boolean
  turnbackCuff: boolean
  // Vent
  vent: VentType | null
}

// ─── PANT ─────────────────────────────────────────────────────────────────────

export type PantCut = 'classico' | 'slim' | 'wide_leg' | 'carrot'
export type PantWaist = 'bassa' | 'media' | 'alta'
export type PleatType = 'flat' | 'single' | 'double'
export type PleatDirection = 'forward' | 'reverse'
export type PantPocketType = 'americana' | 'francesa' | 'dritta'
export type BackPocketType = 'jetted' | 'flap' | 'button'
export type CuffHeight = 3 | 4 | 5

export interface PantConfig {
  cut: PantCut | null
  waist: PantWaist | null
  suspenderButtons: boolean
  // Pleat
  pleat: PleatType | null
  pleatDirection: PleatDirection | null
  // Pockets
  sidePocket: PantPocketType | null
  backPocketCount: 0 | 1 | 2 | null
  backPocketType: BackPocketType | null
  backPocketButton: boolean
  // Belt loops
  beltLoops: boolean
  sideAdjusters: boolean
  beltLoopCount: 5 | 6 | 7 | null
  // Cuffs
  cuff: boolean
  cuffHeight: CuffHeight | null
}

// ─── VEST ─────────────────────────────────────────────────────────────────────

export type VestBreast = 'single' | 'double'
export type VestLapel = 'none' | 'notch' | 'peak' | 'shawl'
export type VestBackMaterial = 'fabric' | 'satin'

export interface VestConfig {
  breast: VestBreast | null
  lapel: VestLapel | null
  buttonCount: number | null
  backMaterial: VestBackMaterial | null
  satinColor: string | null
  pocketCount: 2 | 4 | null
  backBelt: boolean
}

// ─── COLOR CONTRAST ───────────────────────────────────────────────────────────

export interface ColorContrastConfig {
  // Jacket contrast
  jacketContrastEnabled: boolean
  jacketContrastFabricId: string | null
  jacketContrastParts: JacketContrastPart[]
  // Pant contrast
  pantContrastEnabled: boolean
  pantContrastFabricId: string | null
  // Lining
  liningType: 'full' | 'half' | 'none' | null
  liningId: string | null
  flashLining: boolean
  // Piping
  pipingEnabled: boolean
  pipingColor: string | null
  // Back collar
  backCollarContrast: boolean
  backCollarColor: string | null
  embroideryText: string | null
  embroideryThreadColorId: string | null
  // Buttonhole thread
  frontButtonholeThreadId: string | null
  sleeveButtonholeThreadId: string | null
  // Buttons
  jacketButtonId: string | null
  cuffButtonId: string | null
  frontButtonId: string | null
  vestButtonId: string | null
  // Monogram
  monogramEnabled: boolean
  monogramText: string | null
  monogramThreadColorId: string | null
  monogramPosition: MonogramPosition | null
}

export type JacketContrastPart = 'lapels' | 'cuffs' | 'back_collar'
export type MonogramPosition = 'inner_pocket' | 'inner_lining' | 'cuff'

// ─── Navigazione configuratore ────────────────────────────────────────────────

/**
 * Atomic step identifiers — one decision per step (Typeform-style).
 * Sections: setup, fabric, jacket, pant, vest, color, review.
 */
export type ConfigStep =
  // setup
  | 'setup.type'
  | 'setup.measurements'
  // fabric
  | 'fabric.primary'
  | 'fabric.contrast'
  // jacket — atomic
  | 'jacket.cut'
  | 'jacket.school'
  | 'jacket.breast'
  | 'jacket.single_buttons'
  | 'jacket.double_config'
  | 'jacket.shoulder'
  | 'jacket.sleeve'
  | 'jacket.lapel_type'
  | 'jacket.lapel_width'
  | 'jacket.lapel_buttonhole'
  | 'jacket.stab_stitching'
  | 'jacket.lapel_piping'
  | 'jacket.hem_shape'
  | 'jacket.length_offset'
  | 'jacket.side_pocket'
  | 'jacket.breast_pocket'
  | 'jacket.ticket_pocket'
  | 'jacket.sleeve_button_count'
  | 'jacket.surgeons_cuffs'
  | 'jacket.kissing_buttons'
  | 'jacket.turnback_cuff'
  | 'jacket.vent'
  // pant — atomic
  | 'pant.cut'
  | 'pant.waist'
  | 'pant.suspender_buttons'
  | 'pant.pleat'
  | 'pant.pleat_direction'
  | 'pant.side_pocket'
  | 'pant.back_pocket_count'
  | 'pant.back_pocket_type'
  | 'pant.back_pocket_button'
  | 'pant.belt_loops'
  | 'pant.belt_loop_count'
  | 'pant.side_adjusters'
  | 'pant.cuff'
  | 'pant.cuff_height'
  // vest — atomic (only if 3pc / tuxedo / waistcoat)
  | 'vest.breast'
  | 'vest.lapel'
  | 'vest.button_count'
  | 'vest.back_material'
  | 'vest.pockets'
  | 'vest.back_belt'
  // color & details — atomic
  | 'color.jacket_contrast_enabled'
  | 'color.jacket_contrast_fabric'
  | 'color.jacket_contrast_parts'
  | 'color.pant_contrast_enabled'
  | 'color.pant_contrast_fabric'
  | 'color.lining_type'
  | 'color.lining_fabric'
  | 'color.flash_lining'
  | 'color.piping_enabled'
  | 'color.piping_color'
  | 'color.back_collar_contrast'
  | 'color.back_collar_color'
  | 'color.embroidery_text'
  | 'color.embroidery_thread'
  | 'color.front_buttonhole_thread'
  | 'color.sleeve_buttonhole_thread'
  | 'color.jacket_button'
  | 'color.cuff_button'
  | 'color.front_button'
  | 'color.vest_button'
  | 'color.monogram_enabled'
  | 'color.monogram_text'
  | 'color.monogram_thread'
  | 'color.monogram_position'
  // final
  | 'review'

export type StepKind = 'choice' | 'toggle' | 'multi' | 'number' | 'text' | 'range' | 'composite'

export type StepSection =
  | 'setup'
  | 'fabric'
  | 'jacket'
  | 'pant'
  | 'vest'
  | 'color'
  | 'review'

export interface StepDef {
  id: ConfigStep
  label: string
  section: StepSection
  /**
   * Visibility predicate. Receives the full state + an externally injected
   * context (e.g. measurementsCount). Default: always visible.
   */
  condition?: (state: ConfiguratoreState, ctx: StepContext) => boolean
}

export interface StepContext {
  measurementsCount: number
}

export type StepStatus = 'not_started' | 'in_progress' | 'complete' | 'current'
