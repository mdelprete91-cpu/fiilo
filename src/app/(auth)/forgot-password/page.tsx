import Link from 'next/link'
import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { FiloLogo } from '@/components/layout/FiloLogo'

export const metadata: Metadata = {
  title: 'Password dimenticata — filo',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <FiloLogo className="h-7 w-auto text-ink lg:hidden" />
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-ink">Password dimenticata</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci l&apos;email associata al tuo account. Ti invieremo un link per reimpostare la password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          ← Torna al login
        </Link>
      </p>
    </div>
  )
}
