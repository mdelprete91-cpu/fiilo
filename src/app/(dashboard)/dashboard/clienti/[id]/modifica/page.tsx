import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
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

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-3xl">
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title={`Modifica — ${client.first_name} ${client.last_name}`}
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <ClientForm client={client} />
      </div>
    </div>
  )
}
