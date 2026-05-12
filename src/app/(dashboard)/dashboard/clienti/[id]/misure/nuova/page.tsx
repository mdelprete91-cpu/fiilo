import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { MeasurementForm } from '@/components/dashboard/MeasurementForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NuovaMisuraPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('tenant_id', session.tenantId!)
    .single()

  if (!client) notFound()

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-4xl">
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title={`Misure — ${client.first_name} ${client.last_name}`}
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <MeasurementForm clientId={id} />
      </div>
    </div>
  )
}
