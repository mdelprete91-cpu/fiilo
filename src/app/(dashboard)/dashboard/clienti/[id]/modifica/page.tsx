import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BackButton } from '@/components/dashboard/BackButton'
import { ClientForm } from '@/components/dashboard/ClientForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModificaClientePage({ params }: PageProps) {
  const { id } = await params
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', session.tenantId!)
    .single()

  if (!client) notFound()

  // Newsletter preferences (best-effort: la migration 022 potrebbe non essere
  // ancora applicata. In quel caso restiamo silenziosi e usiamo default false).
  let newsletterEmailOptIn = false
  try {
    const prefRes = await (
      supabase.from('newsletter_preferences') as unknown as {
        select: (q: string) => {
          eq: (k: string, v: unknown) => {
            maybeSingle: () => Promise<{
              data: { email_opted_in: boolean } | null
              error: { message: string } | null
            }>
          }
        }
      }
    )
      .select('email_opted_in')
      .eq('client_id', id)
      .maybeSingle()
    if (prefRes.data?.email_opted_in) newsletterEmailOptIn = true
  } catch {
    /* migration 022 non applicata: default false */
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-3xl">
      <BackButton fallbackHref={`/dashboard/clienti/${id}`} label="Indietro" />
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title={`Modifica — ${client.first_name} ${client.last_name}`}
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <ClientForm client={client} newsletterEmailOptIn={newsletterEmailOptIn} />
      </div>
    </div>
  )
}
