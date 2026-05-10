import Link from 'next/link'
import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Password dimenticata — filo',
}

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl text-ink">Password dimenticata</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci l&apos;email del tuo account. Ti invieremo un link per reimpostare la password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-ink hover:underline">
          ← Torna al login
        </Link>
      </p>
    </div>
  )
}
