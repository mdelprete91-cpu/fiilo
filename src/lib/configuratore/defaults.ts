import type {
  ConfiguratoreState, JacketConfig, PantConfig, ColorContrastConfig, FabricConfig,
} from '@/types/configuratore'

export const EMPTY_FABRIC: FabricConfig = {
  primaryFabricId: null, contrastFabricId: null,
}

export const EMPTY_JACKET: JacketConfig = {
  cut: null, school: null, breast: null, singleBreastedButtons: null, doubleBreastedConfig: null,
  shoulder: null, sleeve: null, lapelType: null, lapelWidth: null, lapelWidthCm: null,
  lapelButtonhole: false, stabStitching: false, lapelPiping: false,
  hemShape: null, lengthOffset: 0, sidePocket: null, breastPocket: null, ticketPocket: false,
  sleeveButtonCount: null, surgeonsCuffs: false, kissingButtons: false, turnbackCuff: false,
  vent: null,
}

export const EMPTY_PANT: PantConfig = {
  cut: null, waist: null, suspenderButtons: false,
  pleat: null, pleatDirection: null,
  sidePocket: null, backPocketCount: null, backPocketType: null, backPocketButton: false,
  beltLoops: true, sideAdjusters: false, beltLoopCount: 6,
  cuff: false, cuffHeight: null,
}

export const EMPTY_COLOR: ColorContrastConfig = {
  jacketContrastEnabled: false, jacketContrastFabricId: null, jacketContrastParts: [],
  pantContrastEnabled: false, pantContrastFabricId: null,
  liningType: null, liningId: null, flashLining: false,
  pipingEnabled: false, pipingColor: null,
  backCollarContrast: false, backCollarColor: null, embroideryText: null, embroideryThreadColorId: null,
  frontButtonholeThreadId: null, sleeveButtonholeThreadId: null,
  jacketButtonId: null, cuffButtonId: null, frontButtonId: null, vestButtonId: null,
  monogramEnabled: false, monogramText: null, monogramThreadColorId: null, monogramPosition: null,
}

export function mergeConfigWithDefaults(raw: Record<string, unknown>): ConfiguratoreState {
  const stored = raw as Partial<ConfiguratoreState>
  return {
    garmentType: stored.garmentType ?? null,
    fabric: { ...EMPTY_FABRIC, ...(stored.fabric ?? {}) },
    jacket: { ...EMPTY_JACKET, ...(stored.jacket ?? {}) },
    pant: { ...EMPTY_PANT, ...(stored.pant ?? {}) },
    vest: stored.vest ?? null,
    colorContrast: { ...EMPTY_COLOR, ...(stored.colorContrast ?? {}) },
    measurementId: stored.measurementId ?? null,
  }
}
