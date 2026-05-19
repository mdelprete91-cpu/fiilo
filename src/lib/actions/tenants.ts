'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

// ─── Aggiorna impostazioni della propria sartoria (tenant_admin) ─────────────

export async function updateMyTenantAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin'])
    const tid = session.tenantId!
    const supabase = await createClient()

    const nullify = (v: string | null) => (v === '' || v === null ? null : v)

    const name = formData.get('name') as string
    if (!name?.trim()) return { success: false, error: 'Il nome della sartoria è obbligatorio' }

    const { error } = await supabase.from('tenants').update({
      name: name.trim(),
      email: nullify(formData.get('email') as string),
      phone: nullify(formData.get('phone') as string),
      address: nullify(formData.get('address') as string),
      city: nullify(formData.get('city') as string),
    }).eq('id', tid)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiorna branding (logo + colore brand) ─────────────────────────────────

const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_BYTES = 1_000_000 // 1 MB
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

export async function updateMyBrandingAction(
  formData: FormData,
): Promise<ActionResult<{ logo_url: string | null; brand_color: string | null }>> {
  try {
    const session = await requireRole(['tenant_admin'])
    const tid = session.tenantId!
    const supabase = await createClient()

    const brandColorRaw = (formData.get('brand_color') as string | null)?.trim() ?? ''
    let brandColor: string | null = null
    if (brandColorRaw) {
      if (!HEX_COLOR_REGEX.test(brandColorRaw)) {
        return { success: false, error: 'Colore non valido. Usa formato esadecimale es. #E89B3C.' }
      }
      brandColor = brandColorRaw.toUpperCase()
    }

    const removeLogo = formData.get('remove_logo') === '1'
    const file = formData.get('logo') as File | null

    const update: { brand_color?: string | null; logo_url?: string | null } = {}
    if (brandColorRaw !== '') update.brand_color = brandColor

    if (removeLogo) {
      update.logo_url = null
    } else if (file && typeof file === 'object' && file.size > 0) {
      if (!ALLOWED_LOGO_MIME.includes(file.type)) {
        return {
          success: false,
          error: 'Formato non supportato. Usa PNG, JPG, WebP o SVG.',
        }
      }
      if (file.size > MAX_LOGO_BYTES) {
        return { success: false, error: 'Il logo è troppo pesante (max 1 MB).' }
      }

      const ext = file.type === 'image/svg+xml' ? 'svg'
        : file.type === 'image/png' ? 'png'
        : file.type === 'image/webp' ? 'webp'
        : 'jpg'
      const path = `tenants/${tid}/logo-${Date.now()}.${ext}`
      const buffer = await file.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, buffer, { contentType: file.type, upsert: true })
      if (uploadError) return { success: false, error: `Upload logo fallito: ${uploadError.message}` }

      const { data: pub } = supabase.storage.from('assets').getPublicUrl(path)
      update.logo_url = pub.publicUrl
    }

    if (Object.keys(update).length === 0) {
      return { success: false, error: 'Nessuna modifica da salvare.' }
    }

    const { error } = await supabase.from('tenants').update(update).eq('id', tid)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return {
      success: true,
      data: {
        logo_url: update.logo_url ?? null,
        brand_color: update.brand_color ?? null,
      },
    }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiorna profilo personale ───────────────────────────────────────────────

export async function updateMyProfileAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    const fullName = (formData.get('full_name') as string)?.trim() || null

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
    }).eq('id', session.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiorna lingua preferita ───────────────────────────────────────────────

export async function updateLanguageAction(language: string): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    const supabase = await createClient()

    if (!['it', 'en', 'es'].includes(language)) {
      return { success: false, error: 'Lingua non supportata' }
    }

    const { error } = await supabase.from('profiles')
      .update({ preferred_language: language })
      .eq('id', session.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Invita membro del team (tenant_admin) ────────────────────────────────────

export async function inviteTeamMemberAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin'])
    const tid = session.tenantId!
    const service = await createServiceClient()

    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const role = formData.get('role') as string

    if (!email) return { success: false, error: 'Email obbligatoria' }
    if (!['tenant_admin', 'tenant_staff'].includes(role)) return { success: false, error: 'Ruolo non valido' }

    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = hdrs.get('x-forwarded-proto') ?? 'http'
    const redirectTo = `${proto}://${host}/auth/callback?next=/dashboard/invito/accetta`

    const { error } = await service.auth.admin.inviteUserByEmail(email, {
      data: { pending_tenant_id: tid, pending_role: role },
      redirectTo,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Rimuovi membro dal team (tenant_admin) ───────────────────────────────────

export async function removeTeamMemberAction(roleId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['tenant_admin'])
    const supabase = await createClient()

    // Verifica che il ruolo appartenga al proprio tenant e che non sia se stesso
    const { data: roleRow } = await supabase
      .from('user_tenant_roles')
      .select('user_id, tenant_id')
      .eq('id', roleId)
      .single()

    if (!roleRow || roleRow.tenant_id !== session.tenantId) {
      return { success: false, error: 'Operazione non consentita' }
    }
    if (roleRow.user_id === session.id) {
      return { success: false, error: 'Non puoi rimuovere te stesso' }
    }

    const { error } = await supabase.from('user_tenant_roles').delete().eq('id', roleId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Crea sartoria + admin iniziale ──────────────────────────────────────────

export async function createTenantAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(['platform_owner'])
    const supabase = await createClient()
    const service = await createServiceClient()

    const name = formData.get('name') as string
    const slug = (formData.get('slug') as string).toLowerCase().trim()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const adminName = formData.get('admin_name') as string
    const plan = (formData.get('plan') as string) || 'starter'
    const phone = formData.get('phone') as string || null
    const address = formData.get('address') as string || null
    const city = formData.get('city') as string || null
    const brandColor = formData.get('brand_color') as string || null

    if (!name || !slug || !email || !password) {
      return { success: false, error: 'Campi obbligatori mancanti' }
    }

    // 1. Verifica slug univoco
    const { data: existing } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    if (existing) return { success: false, error: `Slug "${slug}" già in uso` }

    // 2. Crea tenant
    const { data: tenant, error: tenantErr } = await supabase.from('tenants').insert({
      name, slug, plan: plan as 'starter' | 'professional' | 'enterprise',
      email, phone, address, city, brand_color: brandColor, is_active: true,
    }).select('id').single()

    if (tenantErr || !tenant) return { success: false, error: tenantErr?.message ?? 'Errore creazione tenant' }

    // 3. Crea utente Supabase Auth (service role bypassa email confirm)
    const { data: authUser, error: authErr } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: adminName },
    })

    if (authErr || !authUser.user) {
      // rollback tenant
      await supabase.from('tenants').delete().eq('id', tenant.id)
      return { success: false, error: authErr?.message ?? 'Errore creazione utente' }
    }

    const userId = authUser.user.id

    // 4. Crea profilo
    await service.from('profiles').upsert({
      id: userId, full_name: adminName || null,
    })

    // 5. Assegna ruolo tenant_admin
    const { error: roleErr } = await service.from('user_tenant_roles').insert({
      user_id: userId, tenant_id: tenant.id, role: 'tenant_admin',
    })

    if (roleErr) {
      return { success: false, error: roleErr.message }
    }

    revalidatePath('/platform')
    return { success: true, data: { id: tenant.id } }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiorna dati sartoria ───────────────────────────────────────────────────

export async function updateTenantAction(id: string, formData: FormData): Promise<ActionResult<void>> {
  try {
    await requireRole(['platform_owner'])
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = (formData.get('slug') as string).toLowerCase().trim()
    const plan = formData.get('plan') as string
    const email = formData.get('email') as string || null
    const phone = formData.get('phone') as string || null
    const address = formData.get('address') as string || null
    const city = formData.get('city') as string || null
    const brandColor = formData.get('brand_color') as string || null

    // Verifica slug univoco escludendo se stesso
    const { data: conflict } = await supabase.from('tenants').select('id').eq('slug', slug).neq('id', id).single()
    if (conflict) return { success: false, error: `Slug "${slug}" già in uso` }

    const { error } = await supabase.from('tenants').update({
      name, slug, plan: plan as 'starter' | 'professional' | 'enterprise',
      email, phone, address, city, brand_color: brandColor,
    }).eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/platform')
    revalidatePath(`/platform/tenants/${id}`)
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Attiva / disattiva sartoria ─────────────────────────────────────────────

export async function toggleTenantActiveAction(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    await requireRole(['platform_owner'])
    const supabase = await createClient()

    const { error } = await supabase.from('tenants').update({ is_active: isActive }).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/platform')
    revalidatePath(`/platform/tenants/${id}`)
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiungi membro staff ────────────────────────────────────────────────────

export async function addStaffMemberAction(
  tenantId: string,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    await requireRole(['platform_owner'])
    const service = await createServiceClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string || null
    const role = (formData.get('role') as string) || 'tenant_staff'

    if (!email || !password) return { success: false, error: 'Email e password obbligatori' }

    // Cerca se l'utente esiste già
    const { data: existingUsers } = await service.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: authUser, error: authErr } = await service.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (authErr || !authUser.user) return { success: false, error: authErr?.message ?? 'Errore creazione utente' }
      userId = authUser.user.id
      await service.from('profiles').upsert({ id: userId, full_name: fullName })
    }

    // Verifica che non abbia già un ruolo in questo tenant
    const { data: existingRole } = await service.from('user_tenant_roles')
      .select('id').eq('user_id', userId).eq('tenant_id', tenantId).single()

    if (existingRole) return { success: false, error: 'Utente già membro di questa sartoria' }

    const { error: roleErr } = await service.from('user_tenant_roles').insert({
      user_id: userId, tenant_id: tenantId, role: role as 'tenant_admin' | 'tenant_staff',
    })

    if (roleErr) return { success: false, error: roleErr.message }

    revalidatePath(`/platform/tenants/${tenantId}`)
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Rimuovi membro staff ─────────────────────────────────────────────────────

export async function removeStaffMemberAction(roleId: string, tenantId: string): Promise<ActionResult<void>> {
  try {
    await requireRole(['platform_owner'])
    const supabase = await createClient()

    const { error } = await supabase.from('user_tenant_roles').delete().eq('id', roleId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/platform/tenants/${tenantId}`)
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Aggiorna profilo platform owner ──────────────────────────────────────────

export async function updatePlatformOwnerProfileAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['platform_owner'])
    const supabase = await createClient()

    const fullName = (formData.get('full_name') as string)?.trim() || null

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
    }).eq('id', session.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/platform/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

// ─── Super admin (platform_owner) — invite & remove ─────────────────────────

export async function invitePlatformOwnerAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    await requireRole(['platform_owner'])
    const supabase = await createClient()
    const service = await createServiceClient()

    const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
    const fullName = ((formData.get('full_name') as string) ?? '').trim() || null
    const password = (formData.get('password') as string) ?? ''

    if (!email || !password) {
      return { success: false, error: 'Email e password obbligatori' }
    }
    if (password.length < 8) {
      return { success: false, error: 'Password troppo corta (min 8 caratteri)' }
    }

    // Cerca user già esistente (per email)
    const { data: list } = await service.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email)

    let userId: string

    if (existing) {
      userId = existing.id

      // È già platform_owner?
      const { count } = await supabase
        .from('user_tenant_roles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('tenant_id', null)
        .eq('role', 'platform_owner')

      if ((count ?? 0) > 0) {
        return { success: false, error: 'Questo utente è già super admin' }
      }
    } else {
      // Crea nuovo user via service role (bypassa email confirm)
      const { data: newUser, error: createErr } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (createErr || !newUser.user) {
        return { success: false, error: createErr?.message ?? 'Errore creazione utente' }
      }
      userId = newUser.user.id

      // Upsert profilo
      await service.from('profiles').upsert({ id: userId, full_name: fullName })
    }

    // Concede ruolo platform_owner (tenant_id NULL)
    const { error: roleErr } = await service.from('user_tenant_roles').insert({
      user_id: userId,
      tenant_id: null,
      role: 'platform_owner',
    })
    if (roleErr) return { success: false, error: roleErr.message }

    revalidatePath('/platform/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}

export async function removePlatformOwnerAction(
  roleId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(['platform_owner'])
    const service = await createServiceClient()

    // Recupera il ruolo
    const { data: role } = await service
      .from('user_tenant_roles')
      .select('user_id, role, tenant_id')
      .eq('id', roleId)
      .single()

    if (!role || role.role !== 'platform_owner' || role.tenant_id !== null) {
      return { success: false, error: 'Ruolo non trovato' }
    }
    if (role.user_id === session.id) {
      return { success: false, error: 'Non puoi rimuovere te stesso' }
    }

    // Anti-lockout: deve restare almeno un super admin
    const { count } = await service
      .from('user_tenant_roles')
      .select('id', { count: 'exact', head: true })
      .is('tenant_id', null)
      .eq('role', 'platform_owner')
    if ((count ?? 0) <= 1) {
      return { success: false, error: 'Deve restare almeno un super admin' }
    }

    const { error } = await service.from('user_tenant_roles').delete().eq('id', roleId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/platform/settings')
    return { success: true, data: undefined }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore sconosciuto' }
  }
}
