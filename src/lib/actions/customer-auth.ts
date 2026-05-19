'use server'

import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { success: true } | { success: false; error: string }

const schema = z.object({
  email: z.string().email('Email non valida'),
  tenantSlug: z.string().min(1),
})

/**
 * Invia un magic link al cliente per il portale di un tenant specifico.
 * Per evitare di leakare quali email sono registrate, ritorniamo sempre
 * success: il messaggio in UI è "ti abbiamo mandato un'email se l'account
 * esiste".
 *
 * Validazione effettiva (utente esiste + ha ruolo customer_end_user su
 * questo tenant) è centralizzata via service-role: la facciamo qui invece
 * che a Supabase Auth perché signInWithOtp manderebbe il link a chiunque.
 */
export async function sendCustomerMagicLinkAction(input: {
  email: string
  tenantSlug: string
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  // RPC nuova (migration 021), non ancora nei types autogenerati.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantRow } = await (supabase.rpc as any)(
    'portal_get_tenant_by_slug',
    { p_slug: parsed.data.tenantSlug },
  )
  const tenant = Array.isArray(tenantRow) ? tenantRow[0] : tenantRow
  if (!tenant) return { success: false, error: 'Sartoria non trovata' }

  const tenantId = (tenant as { id: string }).id

  // Verifica via service-role che l'utente esista e abbia ruolo
  // customer_end_user su questo tenant. Se no, ritorniamo success (no leak).
  try {
    const service = await createServiceClient()
    const { data: usersList } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const user = usersList?.users.find(
      (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase(),
    )
    if (!user) return { success: true }

    const { data: roles } = await service
      .from('user_tenant_roles')
      .select('role, tenant_id')
      .eq('user_id', user.id)
    const hasRole = (roles ?? []).some(
      (r) => r.tenant_id === tenantId && (r.role as string) === 'customer_end_user',
    )
    if (!hasRole) return { success: true }
  } catch {
    // Fail-open in fase early MVP: continuiamo comunque a tentare l'OTP.
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fiilo.it'
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/c/${parsed.data.tenantSlug}`,
    },
  })
  if (error) {
    return { success: false, error: 'Impossibile inviare il link. Riprova.' }
  }
  return { success: true }
}
