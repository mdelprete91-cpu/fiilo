import { TopBar } from '@/components/layout/TopBar'
import { requireRole } from '@/lib/auth/session'
import { NuovaSartoriaForm } from '@/components/platform/NuovaSartoriaForm'

export default async function NuovaSartoriaPage() {
  const session = await requireRole(['platform_owner'])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title="Nuova sartoria"
      />
      <div className="mx-auto max-w-2xl">
        <NuovaSartoriaForm />
      </div>
    </div>
  )
}
