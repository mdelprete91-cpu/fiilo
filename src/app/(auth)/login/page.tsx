import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accedi — fiilo',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-heading text-5xl leading-[1] text-ink md:text-6xl">
          Accedi
        </h1>
        <p className="text-sm text-muted-foreground">
          Inserisci le credenziali per entrare in fiilo.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
