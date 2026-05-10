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
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { success: false, error: 'Credenziali errate. Riprova.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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
