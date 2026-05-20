'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { FabricSchema, LiningSchema, ButtonSchema, ThreadColorSchema } from '@/lib/validations/catalog'
import type { ActionResult } from './auth'

const CATALOG_PATH = '/dashboard/catalogo'

function nullify(v: string | undefined | null) {
  return v === '' || v === undefined ? null : v
}

// ─── Tessuti ─────────────────────────────────────────────────

export async function upsertFabricAction(id: string | null, formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!

  const parsed = FabricSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }

  const supabase = await createClient()
  const d = parsed.data

  const basePayload = {
    tenant_id: tid,
    name: d.name,
    mill: nullify(d.mill),
    code: nullify(d.code),
    composition: nullify(d.composition),
    weight_grams: d.weight_grams ?? null,
    color: nullify(d.color),
    pattern: d.pattern ?? null,
    price_per_meter: d.price_per_meter ?? null,
    season: d.season ?? null,
    is_available: d.is_available,
  }
  // external_url non è ancora in src/types/database.ts → cast localizzato.
  const payload = {
    ...basePayload,
    external_url: nullify(d.external_url),
  } as typeof basePayload

  const { error } = id
    ? await supabase.from('fabrics').update(payload).eq('id', id).eq('tenant_id', tid)
    : await supabase.from('fabrics').insert(payload)

  if (error) return { success: false, error: error.message }

  revalidatePath(CATALOG_PATH)
  return { success: true }
}

export async function deleteFabricAction(id: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('fabrics').delete().eq('id', id).eq('tenant_id', session.tenantId!)
  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

// ─── Fodere ─────────────────────────────────────────────────

export async function upsertLiningAction(id: string | null, formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!
  const parsed = LiningSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }

  const supabase = await createClient()
  const payload = { tenant_id: tid, name: parsed.data.name, color: nullify(parsed.data.color), material: nullify(parsed.data.material), is_available: parsed.data.is_available }

  const { error } = id
    ? await supabase.from('linings').update(payload).eq('id', id).eq('tenant_id', tid)
    : await supabase.from('linings').insert(payload)

  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

export async function deleteLiningAction(id: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('linings').delete().eq('id', id).eq('tenant_id', session.tenantId!)
  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

// ─── Bottoni ─────────────────────────────────────────────────

export async function upsertButtonAction(id: string | null, formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!
  const parsed = ButtonSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }

  const supabase = await createClient()
  const payload = { tenant_id: tid, name: parsed.data.name, material: parsed.data.material, color: nullify(parsed.data.color), finish: nullify(parsed.data.finish), is_available: parsed.data.is_available }

  const { error } = id
    ? await supabase.from('buttons').update(payload).eq('id', id).eq('tenant_id', tid)
    : await supabase.from('buttons').insert(payload)

  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

export async function deleteButtonAction(id: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('buttons').delete().eq('id', id).eq('tenant_id', session.tenantId!)
  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

// ─── Colori filo ─────────────────────────────────────────────

export async function upsertThreadColorAction(id: string | null, formData: FormData): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tid = session.tenantId!
  const parsed = ThreadColorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }

  const supabase = await createClient()
  const payload = { tenant_id: tid, name: parsed.data.name, hex_color: parsed.data.hex_color, is_available: parsed.data.is_available }

  const { error } = id
    ? await supabase.from('thread_colors').update(payload).eq('id', id).eq('tenant_id', tid)
    : await supabase.from('thread_colors').insert(payload)

  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}

export async function deleteThreadColorAction(id: string): Promise<ActionResult> {
  const session = await requireRole(['tenant_admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('thread_colors').delete().eq('id', id).eq('tenant_id', session.tenantId!)
  if (error) return { success: false, error: error.message }
  revalidatePath(CATALOG_PATH)
  return { success: true }
}
