import Link from 'next/link'
import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Password dimenticata — fiilo',
}

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl text-ink">Password dimenticata</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci l&apos;email del tuo account: ti invieremo un link per reimpostarla.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="pt-1 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          ← Torna al login
        </Link>
      </p>
    </div>
  )
}
