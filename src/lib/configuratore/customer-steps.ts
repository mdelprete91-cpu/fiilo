import type { ConfigStep } from '@/types/configuratore'

// Whitelist di step esposti al customer end-user. Sottoinsieme dei
// STEP_REGISTRY del gestionale. Escludiamo dettagli sartoriali troppo tecnici
// (kissing buttons, stab stitching, asola bavero/manica, lapel piping,
// turnback cuff, surgeons cuffs, length offset, lapel buttonhole, lapel width
// in cm, embroidery thread, monogram position avanzata, configurazioni
// doppiopetto fini, ecc.) e tutto ciò che ha implicazioni di costo non
// gestibili dal cliente. I valori vengono pre-popolati da defaults.ts in
// fase di creazione draft.
export const CUSTOMER_STEPS: ReadonlySet<ConfigStep> = new Set<ConfigStep>([
  // setup
  'setup.type',
  // fabric — solo il primario
  'fabric.primary',
  // jacket — scelte macro
  'jacket.cut',
  'jacket.breast',
  'jacket.single_buttons',
  'jacket.lapel_type',
  'jacket.side_pocket',
  'jacket.breast_pocket',
  'jacket.vent',
  // pant — scelte macro
  'pant.cut',
  'pant.waist',
  'pant.pleat',
  'pant.cuff',
  // vest (se applicabile)
  'vest.breast',
  'vest.button_count',
  // colore & dettagli — solo i visivi
  'color.lining_type',
  'color.lining_fabric',
  'color.jacket_button',
  // final
  'review',
])

export function isCustomerStep(step: ConfigStep): boolean {
  return CUSTOMER_STEPS.has(step)
}
