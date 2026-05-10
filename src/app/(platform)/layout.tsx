import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole(['platform_owner']).catch(() => null)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex lg:shrink-0">
        <AppSidebar
          role={session.role}
          userName={session.fullName ?? session.email}
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
