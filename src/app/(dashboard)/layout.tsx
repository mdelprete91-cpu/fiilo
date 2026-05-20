import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { ImpersonateBanner } from '@/components/dashboard/ImpersonateBanner'
import { StatusBanner } from '@/components/layout/StatusBanner'
import { Toaster } from '@/components/ui/sonner'
import { getUnreadCount } from '@/lib/actions/whatsapp'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole(['tenant_admin', 'tenant_staff']).catch(() => null)
  if (!session) redirect('/login')

  let tenantName: string | undefined
  if (session.tenantId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', session.tenantId)
      .single()
    tenantName = data?.name ?? undefined
  }

  const unreadNotifications = await getUnreadCount().catch(() => 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <StatusBanner />
      {session.isImpersonating && tenantName && (
        <ImpersonateBanner tenantName={tenantName} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex lg:shrink-0">
          <AppSidebar
            role={session.role}
            userName={session.fullName ?? session.email}
            unreadNotifications={unreadNotifications}
          />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
