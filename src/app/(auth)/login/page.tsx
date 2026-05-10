import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accedi — Sartoria',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-ink">Accedi</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci le tue credenziali per accedere al gestionale
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
