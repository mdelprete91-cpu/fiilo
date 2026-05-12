'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LoginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
})

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { success: false, error: 'Credenziali errate. Riprova.' }
  }

  // Determina il ruolo per smistare al landing corretto. Senza questo,
  // un platform_owner finisce su /dashboard → bocciato dal layout →
  // /login → middleware lo rimanda a /dashboard → loop infinito.
  let target = '/dashboard'
  if (data.user?.id) {
    const { data: roleRow } = await supabase
      .from('user_tenant_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (roleRow?.role === 'platform_owner') target = '/platform'
  }

  revalidatePath('/', 'layout')
  redirect(target)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function sendMagicLinkAction(formData: FormData): Promise<ActionResult> {
  const email = z.string().email().safeParse(formData.get('email'))
  if (!email.success) {
    return { success: false, error: 'Email non valida' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { success: false, error: 'Impossibile inviare il link. Riprova.' }
  }

  return { success: true }
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = z.string().email().safeParse(formData.get('email'))
  if (!email.success) {
    return { success: false, error: 'Email non valida' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  })

  // Always return success to avoid leaking which emails are registered.
  if (error) {
    console.error('Password reset request failed:', error.message)
  }
  return { success: true }
}

const PasswordSchema = z.object({
  password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Le password non coincidono',
  path: ['confirm'],
})

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = PasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { success: false, error: 'Impossibile aggiornare la password. Riprova dal link nella mail.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
