import { z } from 'zod'

export const FabricSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(200),
  mill: z.string().max(100).optional().or(z.literal('')),
  code: z.string().max(50).optional().or(z.literal('')),
  composition: z.string().max(200).optional().or(z.literal('')),
  weight_grams: z.coerce.number().int().positive().optional().nullable(),
  color: z.string().max(100).optional().or(z.literal('')),
  pattern: z.enum(['solid','striped','checked','herringbone','houndstooth','plaid','windowpane','paisley','other']).optional().nullable(),
  price_per_meter: z.coerce.number().positive().optional().nullable(),
  season: z.enum(['spring_summer','autumn_winter','all_season']).optional().nullable(),
  is_available: z.coerce.boolean().default(true),
  external_url: z
    .string()
    .max(2000)
    .url('Inserisci un URL valido (es. https://sartoria.it/tessuti/...)')
    .optional()
    .or(z.literal('')),
})
export type FabricFormData = z.infer<typeof FabricSchema>

export const LiningSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(200),
  color: z.string().max(100).optional().or(z.literal('')),
  material: z.string().max(100).optional().or(z.literal('')),
  is_available: z.coerce.boolean().default(true),
})
export type LiningFormData = z.infer<typeof LiningSchema>

export const ButtonSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(200),
  material: z.enum(['horn','corozo','mother_of_pearl','plastic','metal']),
  color: z.string().max(100).optional().or(z.literal('')),
  finish: z.string().max(100).optional().or(z.literal('')),
  is_available: z.coerce.boolean().default(true),
})
export type ButtonFormData = z.infer<typeof ButtonSchema>

export const ThreadColorSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  hex_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Inserisci un colore esadecimale valido (#RRGGBB)'),
  is_available: z.coerce.boolean().default(true),
})
export type ThreadColorFormData = z.infer<typeof ThreadColorSchema>
