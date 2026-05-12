import { requireRole } from '@/lib/auth/session'
import { TopBar } from '@/components/layout/TopBar'
import { ClientForm } from '@/components/dashboard/ClientForm'

export default async function NuovoClientePage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-3xl">
      <TopBar role={session.role} userName={session.fullName ?? session.email} title="Nuovo cliente" />
      <div className="rounded-xl border border-border bg-card p-6">
        <ClientForm />
      </div>
    </div>
  )
}
