'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { decryptToken, getIntegrationByTenant } from '@/lib/whatsapp/integrations'
import { sendTextMessage } from '@/lib/whatsapp/meta-client'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

function generateInviteToken(): string {
  // 32 byte → 64 hex chars. Random monouso, niente PII.
  return randomBytes(32).toString('hex')
}

interface InviteResult {
  inviteId: string
  token: string
  link: string
  whatsappSent: boolean
}

// Le tabelle customer_invites, client_user_links e il valore enum
// 'customer_end_user' non sono ancora nei types autogenerati di
// src/types/database.ts (vincolo: NON rigenerare). Usiamo un wrapper untyped
// solo per queste operazioni.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

/**
 * Crea un invito monouso per il cliente, salva il record e (best-effort)
 * invia il link via WhatsApp se l'integrazione del tenant è attiva e il
 * cliente ha un numero di telefono.
 */
export async function createCustomerInvite(
  clientId: string,
): Promise<ActionResult<InviteResult>> {
  try {
    const session = await requireRole(['tenant_admin', 'tenant_staff'])
    if (!session.tenantId) return { success: false, error: 'Tenant non valido' }

    const supabase = await createClient()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, tenant_id')
      .eq('id', clientId)
      .eq('tenant_id', session.tenantId)
      .single()
    if (clientError || !client) {
      return { success: false, error: 'Cliente non trovato' }
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug, name')
      .eq('id', session.tenantId)
      .single()
    if (!tenant) return { success: false, error: 'Sartoria non trovata' }

    const token = generateInviteToken()

    const service = (await createServiceClient()) as AnyClient
    const { data: invite, error: insertError } = await service
      .from('customer_invites')
      .insert({
        token,
        client_id: clientId,
        tenant_id: session.tenantId,
        created_by: session.id,
      })
      .select('id')
      .single()

    if (insertError || !invite) {
      return {
        success: false,
        error: insertError?.message ?? 'Impossibile creare invito',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fiilo.it'
    const link = `${baseUrl}/c/${tenant.slug}/invite/${token}`

    // Tentiamo l'invio WhatsApp (best-effort, l'invito è già creato).
    let whatsappSent = false
    if (client.phone) {
      try {
        const integration = await getIntegrationByTenant(session.tenantId)
        if (integration && integration.status === 'connected') {
          const wToken = await decryptToken(integration.id)
          if (wToken) {
            const greeting = client.first_name ? `Ciao ${client.first_name},` : 'Ciao,'
            const body =
              `${greeting} ${tenant.name} ti invita al tuo portale personale ` +
              `dove puoi vedere le tue misure, sfogliare i tessuti e configurare nuovi ordini.\n\n` +
              `Accedi qui (valido 7 giorni):\n${link}`
            await sendTextMessage({
              token: wToken,
              phoneNumberId: integration.phone_number_id,
              to: client.phone,
              body,
            })
            whatsappSent = true
          }
        }
      } catch {
        // Best-effort. Il link resta valido — il sarto può comunque condividerlo.
      }
    }

    revalidatePath(`/dashboard/clienti/${clientId}`)
    return {
      success: true,
      data: { inviteId: invite.id, token, link, whatsappSent },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}

interface InviteRow {
  id: string
  client_id: string
  tenant_id: string
  expires_at: string
  used_at: string | null
}

/**
 * Scambia un token invito → crea (se serve) l'utente Supabase, lo collega
 * al cliente come `customer_end_user` e fa il sign-in via magic link.
 */
export async function consumeCustomerInvite(
  token: string,
): Promise<
  | { success: true; magicLink: string; tenantSlug: string }
  | { success: false; error: string }
> {
  try {
    if (!token || token.length < 32) {
      return { success: false, error: 'Token non valido' }
    }

    const service = (await createServiceClient()) as AnyClient

    const { data: inviteRaw } = await service
      .from('customer_invites')
      .select('id, client_id, tenant_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()
    const invite = inviteRaw as InviteRow | null

    if (!invite) return { success: false, error: 'Invito non trovato' }
    if (invite.used_at) return { success: false, error: 'Invito già utilizzato' }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Invito scaduto' }
    }

    const { data: client } = await service
      .from('clients')
      .select('id, email, first_name, last_name')
      .eq('id', invite.client_id)
      .single()
    if (!client) return { success: false, error: 'Cliente non trovato' }
    if (!client.email) {
      return {
        success: false,
        error:
          'Il cliente non ha un\'email associata. Aggiorna la scheda cliente.',
      }
    }

    const { data: tenant } = await service
      .from('tenants')
      .select('slug')
      .eq('id', invite.tenant_id)
      .single()
    if (!tenant) return { success: false, error: 'Sartoria non trovata' }

    // Trova o crea l'utente Supabase per quest'email.
    const { data: usersList } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const existing = usersList?.users.find(
      (u: { email?: string | null }) =>
        u.email?.toLowerCase() === client.email.toLowerCase(),
    )

    let userId: string
    if (existing) {
      userId = (existing as { id: string }).id
    } else {
      const fullName = `${client.first_name} ${client.last_name}`.trim()
      const { data: created, error: createError } =
        await service.auth.admin.createUser({
          email: client.email,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        })
      if (createError || !created?.user) {
        return {
          success: false,
          error: createError?.message ?? 'Impossibile creare utente',
        }
      }
      userId = created.user.id
    }

    // Garantisci che esista il ruolo customer_end_user per (utente, tenant).
    await service.from('user_tenant_roles').upsert(
      {
        user_id: userId,
        tenant_id: invite.tenant_id,
        role: 'customer_end_user',
      },
      { onConflict: 'user_id,tenant_id,role' },
    )

    // Garantisci il link client ↔ user.
    await service.from('client_user_links').upsert(
      {
        client_id: invite.client_id,
        user_id: userId,
        tenant_id: invite.tenant_id,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' },
    )

    // Marca l'invito come consumato.
    await service
      .from('customer_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id)

    // Genera magic link per completare il login.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fiilo.it'
    const redirectTo = `${baseUrl}/auth/callback?next=/c/${tenant.slug}`
    const { data: linkData, error: linkError } =
      await service.auth.admin.generateLink({
        type: 'magiclink',
        email: client.email,
        options: { redirectTo },
      })
    if (linkError || !linkData?.properties?.action_link) {
      return {
        success: false,
        error: linkError?.message ?? 'Impossibile generare link di accesso',
      }
    }

    return {
      success: true,
      magicLink: linkData.properties.action_link as string,
      tenantSlug: tenant.slug,
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Errore sconosciuto',
    }
  }
}
