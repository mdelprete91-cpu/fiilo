import { CustomerLoginForm } from '@/components/customer/CustomerLoginForm'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ sent?: string; error?: string }>
}

export default async function CustomerLoginPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params
  const { sent, error } = await searchParams

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-ink">Accedi</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci la tua email per accedere al tuo portale.
        </p>
      </div>

      {sent === '1' ? (
        <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
          Ti abbiamo inviato un link di accesso via email. Controlla la tua casella.
        </div>
      ) : (
        <CustomerLoginForm tenantSlug={tenantSlug} />
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}
    </div>
  )
}
