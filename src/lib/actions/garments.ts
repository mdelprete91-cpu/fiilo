'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import type { ConfiguratoreState, ConfigStep } from '@/types/configuratore'
import type { GarmentStatus } from '@/types/database'

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

export async function createGarmentAction(clientId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const { data, error } = await supabase.from('garments').insert({
      client_id: clientId,
      tenant_id: session.tenantId!,
      // Default placeholder until the user picks a type at setup.type.
      // The DB column is non-null so we keep suit_2pc as the row-level default
      // and overwrite when the user makes their choice.
      type: 'suit_2pc',
      name: 'Nuovo ordine',
      status: 'draft',
      current_step: 'setup.type',
      configuration: {
        garmentType: null,
        fabric: { primaryFabricId: null, contrastFabricId: null },
        jacket: {
          cut: null, school: null, breast: null, singleBreastedButtons: null, doubleBreastedConfig: null,
          shoulder: null, sleeve: null, lapelType: null, lapelWidth: null, lapelWidthCm: null,
          lapelButtonhole: false, stabStitching: false, lapelPiping: false,
          hemShape: null, lengthOffset: 0, sidePocket: null, breastPocket: null, ticketPocket: false,
          sleeveButtonCount: null, surgeonsCuffs: false, kissingButtons: false, turnbackCuff: false, vent: null,
        },
        pant: {
          cut: null, waist: null, suspenderButtons: false, pleat: null, pleatDirection: null,
          sidePocket: null, backPocketCount: null, backPocketType: null, backPocketButton: false,
          beltLoops: true, sideAdjusters: false, beltLoopCount: 6, cuff: false, cuffHeight: null,
        },
        vest: null,
        colorContrast: {
          jacketContrastEnabled: false, jacketContrastFabricId: null, jacketContrastParts: [],
          pantContrastEnabled: false, pantContrastFabricId: null,
          liningType: null, liningId: null, flashLining: false,
          pipingEnabled: false, pipingColor: null,
          backCollarContrast: false, backCollarColor: null, embroideryText: null, embroideryThreadColorId: null,
          frontButtonholeThreadId: null, sleeveButtonholeThreadId: null,
          jacketButtonId: null, cuffButtonId: null, frontButtonId: null, vestButtonId: null,
          monogramEnabled: false, monogramText: null, monogramThreadColorId: null, monogramPosition: null,
        },
        measurementId: null,
      },
    }).select('id').single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: { id: data.id } }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function saveGarmentAction(
  garmentId: string,
  name: string,
  currentStep: ConfigStep,
  config: ConfiguratoreState,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    // Keep the denormalized `type` column in sync with config.garmentType once
    // the user has picked one (so produzione filters / lists work correctly).
    const baseUpdate = {
      name,
      current_step: currentStep,
      configuration: config as unknown as Record<string, unknown>,
    }
    const update = config.garmentType
      ? { ...baseUpdate, type: config.garmentType }
      : baseUpdate

    const { error } = await supabase
      .from('garments')
      .update(update)
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

interface PaymentFields {
  total_price: number | null
  payment_mode: 'deposit' | 'full' | 'on_delivery' | null
  deposit_amount: number | null
  delivery_eta: string | null
}

export async function finalizeGarmentAction(
  garmentId: string,
  clientId: string,
  payment: PaymentFields = { total_price: null, payment_mode: null, deposit_amount: null, delivery_eta: null },
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const { error } = await supabase
      .from('garments')
      .update({
        status: 'confirmed',
        current_step: 'review',
        total_price: payment.total_price,
        payment_mode: payment.payment_mode,
        deposit_amount: payment.payment_mode === 'deposit' ? payment.deposit_amount : null,
        delivery_eta: payment.delivery_eta,
      })
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/dashboard/clienti/${clientId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/panoramica')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function updatePaymentStatusAction(
  garmentId: string,
  payment_status: 'pending' | 'partial' | 'paid',
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const { error } = await supabase
      .from('garments')
      .update({ payment_status })
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/panoramica')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function updateGarmentStatusAction(
  garmentId: string,
  status: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const validStatuses: GarmentStatus[] = ['draft', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(status as GarmentStatus)) return { success: false, error: 'Stato non valido' }

    const { error } = await supabase
      .from('garments')
      .update({ status: status as GarmentStatus })
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/produzione')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function updateGarmentDetailsAction(
  garmentId: string,
  data: {
    delivery_eta?: string | null
    internal_notes?: string | null
    total_price?: number | null
    deposit_amount?: number | null
    payment_status?: 'pending' | 'partial' | 'paid'
  },
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const { data: garmentRow, error: fetchError } = await supabase
      .from('garments')
      .select('client_id')
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)
      .single()

    if (fetchError || !garmentRow) return { success: false, error: 'Abito non trovato' }

    const { error } = await supabase
      .from('garments')
      .update(data)
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/clienti/${garmentRow.client_id}`)
    revalidatePath(`/dashboard/clienti/${garmentRow.client_id}/abiti/${garmentId}`)
    revalidatePath('/dashboard/produzione')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function updateGarmentAssigneeAction(
  garmentId: string,
  assignedTo: string | null,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()
    const { error } = await supabase
      .from('garments')
      .update({ assigned_to: assignedTo })
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/produzione')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function toggleNeedsMaterialsAction(
  garmentId: string,
  value: boolean,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()
    const { error } = await supabase
      .from('garments')
      .update({ needs_materials: value })
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/produzione')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function deleteGarmentAction(garmentId: string, clientId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const { error } = await supabase
      .from('garments')
      .delete()
      .eq('id', garmentId)
      .eq('tenant_id', session.tenantId!)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/dashboard/clienti/${clientId}`)
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}
