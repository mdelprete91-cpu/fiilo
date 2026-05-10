import { z } from 'zod'

export const ClientSchema = z.object({
  first_name: z.string().min(1, 'Il nome è obbligatorio').max(100),
  last_name: z.string().min(1, 'Il cognome è obbligatorio').max(100),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})
export type ClientFormData = z.infer<typeof ClientSchema>

export const MeasurementSchema = z.object({
  taken_at: z.string().min(1),
  chest: z.coerce.number().positive().optional().nullable(),
  waist: z.coerce.number().positive().optional().nullable(),
  hips: z.coerce.number().positive().optional().nullable(),
  shoulders: z.coerce.number().positive().optional().nullable(),
  sleeve_length: z.coerce.number().positive().optional().nullable(),
  back_length: z.coerce.number().positive().optional().nullable(),
  neck: z.coerce.number().positive().optional().nullable(),
  wrist: z.coerce.number().positive().optional().nullable(),
  crotch: z.coerce.number().positive().optional().nullable(),
  inseam: z.coerce.number().positive().optional().nullable(),
  outseam: z.coerce.number().positive().optional().nullable(),
  thigh: z.coerce.number().positive().optional().nullable(),
  knee: z.coerce.number().positive().optional().nullable(),
  calf: z.coerce.number().positive().optional().nullable(),
  ankle: z.coerce.number().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  posture_notes: z.string().max(1000).optional().nullable(),
})
export type MeasurementFormData = z.infer<typeof MeasurementSchema>
