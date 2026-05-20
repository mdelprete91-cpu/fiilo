import type { Metadata } from 'next'
import { FiiloLogo } from '@/components/layout/FiiloLogo'

export const metadata: Metadata = {
  title: 'Manutenzione · fiilo',
  description: 'Stiamo migliorando filo. Torniamo tra pochi minuti.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ManutenzionePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <FiiloLogo className="h-10 w-auto text-foreground" />

        <h1 className="mt-10 font-heading text-3xl leading-tight text-ink">
          Stiamo migliorando filo.
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          Torniamo tra pochi minuti. Grazie per la pazienza.
        </p>

        <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span>Manutenzione programmata in corso</span>
        </div>
      </div>
    </main>
  )
}
