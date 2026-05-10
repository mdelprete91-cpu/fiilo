import { requireRole } from '@/lib/auth/session'
import { getNotifications, getUnreadCount } from '@/lib/actions/whatsapp'
import { TopBar } from '@/components/layout/TopBar'
import { NotificheList } from '@/components/dashboard/NotificheList'

export default async function NotifichePage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const [messages, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ])

  return (
    <div className="min-h-full bg-background space-y-6 p-6 lg:p-8">
      <TopBar
        role={session.role}
        userName={session.fullName ?? session.email}
        title="Notifiche"
        subtitle="Messaggi WhatsApp dai tuoi clienti"
      />
      <NotificheList
        messages={messages}
        unreadCount={unreadCount}
        tenantId={session.tenantId!}
      />
    </div>
  )
}
