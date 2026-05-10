'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { ClientSchema, MeasurementSchema } from '@/lib/validations/client'
import type { ActionResult } from './auth'

// ─── Clienti ─────────────────────────────────────────────────

export async function createClientQuietAction(
  first_name: string,
  last_name: string,
  phone?: string,
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: session.tenantId!,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
    })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/clienti')
  return { success: true, data: { id: data.id } }
}

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()

  const nullify = (v: string | undefined) => (v === '' || v === undefined ? null : v)

  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: tid,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: nullify(parsed.data.email),
      phone: nullify(parsed.data.phone),
      date_of_birth: nullify(parsed.data.date_of_birth),
      address: nullify(parsed.data.address),
      city: nullify(parsed.data.city),
      country: nullify(parsed.data.country),
      notes: nullify(parsed.data.notes),
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clienti')
  redirect(`/dashboard/clienti/${data.id}`)
}

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = ClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const nullify = (v: string | undefined) => (v === '' || v === undefined ? null : v)

  const { error } = await supabase
    .from('clients')
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: nullify(parsed.data.email),
      phone: nullify(parsed.data.phone),
      date_of_birth: nullify(parsed.data.date_of_birth),
      address: nullify(parsed.data.address),
      city: nullify(parsed.data.city),
      country: nullify(parsed.data.country),
      notes: nullify(parsed.data.notes),
    })
    .eq('id', clientId)
    .eq('tenant_id', tid)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/clienti/${clientId}`)
  return { success: true }
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const tid = session.tenantId!

  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('tenant_id', tid)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti')
}

// ─── Misure ─────────────────────────────────────────────────

export async function createMeasurementAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = MeasurementSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('client_measurements').insert({
    tenant_id: tid,
    client_id: clientId,
    taken_by: session.id,
    ...parsed.data,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/clienti/${clientId}`)
  return { success: true }
}
