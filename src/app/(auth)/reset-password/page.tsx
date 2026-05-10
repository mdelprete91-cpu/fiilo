import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Imposta nuova password — filo',
}

export default async function ResetPasswordPage() {
  // The user must arrive here with a valid recovery session set by the
  // /auth/callback route after clicking the email link. Without it, send them
  // back to the request page.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/forgot-password?error=expired')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl text-ink">Nuova password</h1>
        <p className="text-sm text-muted-foreground">
          Scegli una password di almeno 8 caratteri.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
