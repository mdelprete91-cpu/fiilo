// Typed option sets for the configuratore UI

export interface Option<T extends string | number> {
  value: T
  label: string
  description?: string
}

// ─── JACKET ──────────────────────────────────────────────────────────────────

export const JACKET_CUT: Option<string>[] = [
  { value: 'slim', label: 'Slim', description: 'Vita alta, spalle aderenti' },
  { value: 'fitted', label: 'Fitted', description: 'Equilibrato, vita leggera' },
  { value: 'classic', label: 'Classico', description: 'Ampio e confortevole' },
]

export const SARTORIAL_SCHOOL: Option<string>[] = [
  { value: 'napoletana', label: 'Napoletana', description: 'Spalla morbida, petto leggero' },
  { value: 'milanese', label: 'Milanese', description: 'Strutturata, elegante' },
  { value: 'inglese', label: 'Inglese', description: 'Spalla roped, petto pieno' },
  { value: 'americana', label: 'Americana', description: 'Destrutto, comfort first' },
]

export const BREAST_TYPE: Option<string>[] = [
  { value: 'single', label: 'Monopetto' },
  { value: 'double', label: 'Doppiopetto' },
]

export const SINGLE_BREASTED_BUTTONS: Option<number>[] = [
  { value: 1, label: '1 bottone' },
  { value: 2, label: '2 bottoni' },
  { value: 3, label: '3 bottoni' },
]

export const DOUBLE_BREASTED_CONFIG: Option<string>[] = [
  { value: '6x2', label: '6×2', description: '6 bottoni, 2 funzionali' },
  { value: '6x1', label: '6×1', description: '6 bottoni, 1 funzionale' },
  { value: '4x2', label: '4×2', description: '4 bottoni, 2 funzionali' },
  { value: '4x1', label: '4×1', description: '4 bottoni, 1 funzionale' },
]

export const SHOULDER_TYPE: Option<string>[] = [
  { value: 'napoletana_camicia', label: 'Napoletana camicia', description: 'Cucita a mano, delicata' },
  { value: 'napoletana_mappina', label: 'Napoletana mappina', description: 'Con risvolto aperto' },
  { value: 'insellata', label: 'Insellata', description: 'Spalla scavata, moderna' },
  { value: 'roped', label: 'Roped (rollino)', description: 'Spalla alta, inglese' },
  { value: 'padded', label: 'Imbottita', description: 'Strutturata classica' },
]

export const SLEEVE_TYPE: Option<string>[] = [
  { value: 'rollino', label: 'A rollino', description: 'Testa di manica morbida' },
  { value: 'liscia', label: 'Liscia', description: 'Applicazione piatta' },
]

export const LAPEL_TYPE: Option<string>[] = [
  { value: 'notch', label: 'Notch (a lancia)', description: 'Classico, versatile' },
  { value: 'peak', label: 'Peak (a punte)', description: 'Elegante, formale' },
  { value: 'shawl', label: 'Shawl (scialle)', description: 'Per smoking e formalwear' },
]

export const LAPEL_WIDTH: Option<string>[] = [
  { value: 'narrow', label: 'Stretta', description: 'Fino a 7 cm' },
  { value: 'medium', label: 'Media', description: '7–9 cm' },
  { value: 'wide', label: 'Larga', description: 'Oltre 9 cm' },
]

export const HEM_SHAPE: Option<string>[] = [
  { value: 'squared', label: 'Dritta' },
  { value: 'rounded', label: 'Arrotondata' },
]

export const SIDE_POCKET: Option<string>[] = [
  { value: 'flap', label: 'Con patta' },
  { value: 'jetted', label: 'A filo (barchetta)' },
  { value: 'patch', label: 'Patch (applicata)' },
  { value: 'slanted', label: 'Obliqua' },
]

export const BREAST_POCKET: Option<string>[] = [
  { value: 'straight', label: 'Dritta' },
  { value: 'barchetta', label: 'A barchetta' },
  { value: 'patch', label: 'Patch' },
]

export const SLEEVE_BUTTON_COUNT: Option<number>[] = [
  { value: 2, label: '2 bottoni' },
  { value: 3, label: '3 bottoni' },
  { value: 4, label: '4 bottoni' },
]

export const VENT_TYPE: Option<string>[] = [
  { value: 'ventless', label: 'Senza spacco' },
  { value: 'single', label: 'Spacco centrale' },
  { value: 'double', label: 'Doppio spacco' },
]

// ─── PANT ─────────────────────────────────────────────────────────────────────

export const PANT_CUT: Option<string>[] = [
  { value: 'classico', label: 'Classico' },
  { value: 'slim', label: 'Slim' },
  { value: 'wide_leg', label: 'Wide leg' },
  { value: 'carrot', label: 'Carrot' },
]

export const PANT_WAIST: Option<string>[] = [
  { value: 'bassa', label: 'Bassa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta (con cinturino)' },
]

export const PLEAT_TYPE: Option<string>[] = [
  { value: 'flat', label: 'Piatto' },
  { value: 'single', label: 'Una pinces' },
  { value: 'double', label: 'Due pinces' },
]

export const PLEAT_DIRECTION: Option<string>[] = [
  { value: 'forward', label: 'In avanti' },
  { value: 'reverse', label: 'All\'indietro (reverse)' },
]

export const FRONT_POCKET: Option<string>[] = [
  { value: 'americana', label: 'Americana' },
  { value: 'francesa', label: 'Francese' },
  { value: 'dritta', label: 'Dritta' },
]

export const BACK_POCKET: Option<string>[] = [
  { value: 'jetted', label: 'A filo' },
  { value: 'flap', label: 'Con patta' },
  { value: 'button', label: 'Con bottone' },
]

export const CUFF_HEIGHT: Option<number>[] = [
  { value: 3, label: '3 cm' },
  { value: 4, label: '4 cm' },
  { value: 5, label: '5 cm' },
]

// ─── VEST ─────────────────────────────────────────────────────────────────────

export const VEST_BREAST: Option<string>[] = [
  { value: 'single', label: 'Monopetto' },
  { value: 'double', label: 'Doppiopetto' },
]

export const VEST_LAPEL: Option<string>[] = [
  { value: 'notch', label: 'Notch' },
  { value: 'peak', label: 'Peak' },
  { value: 'shawl', label: 'Shawl' },
  { value: 'collarless', label: 'Senza bavero' },
]

export const VEST_BACK_MATERIAL: Option<string>[] = [
  { value: 'lining', label: 'Fodera standard' },
  { value: 'satin', label: 'Raso' },
  { value: 'fabric', label: 'Stesso tessuto' },
]

export const VEST_POCKET_COUNT: Option<number>[] = [
  { value: 2, label: '2 tasche' },
  { value: 4, label: '4 tasche' },
]

// ─── LINING ───────────────────────────────────────────────────────────────────

export const LINING_TYPE: Option<string>[] = [
  { value: 'full', label: 'Intera' },
  { value: 'half', label: 'Mezza fodera' },
  { value: 'none', label: 'Sfoderato' },
]
