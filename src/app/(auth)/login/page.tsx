import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accedi — filo',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl text-ink">Accedi</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci le credenziali per entrare in filo.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
