'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FiiloLogo } from './FiiloLogo'
import { NotificationsBell } from './NotificationsBell'
import { UserMenu } from './UserMenu'
import type { TenantRole } from '@/types/database'

interface NavItem {
  label: string
  href: string
}

const dashboardNav: NavItem[] = [
  { label: 'Panoramica', href: '/dashboard' },
  { label: 'Produzione', href: '/dashboard/produzione' },
  { label: 'Clienti', href: '/dashboard/clienti' },
  { label: 'Catalogo', href: '/dashboard/catalogo' },
  { label: 'Marketing', href: '/dashboard/marketing' },
  { label: 'Impostazioni', href: '/dashboard/settings' },
]

const platformNav: NavItem[] = [
  { label: 'Overview', href: '/platform' },
  { label: 'Sartorie', href: '/platform/tenants' },
  { label: 'Impostazioni', href: '/platform/settings' },
]

/*
 * Dark sidebar palette — warm brown-black, like a leather ledger spine
 * next to an open cream page. Stays dark in light theme; the main content
 * area is what flips between light and dark via next-themes.
 */
const D = {
  bg:       'oklch(0.16 0.012 80)',
  border:   'oklch(0.24 0.010 80)',
  ink:      'oklch(0.94 0.006 80)',
  fg:       'oklch(0.92 0.008 80)',
  fgMuted:  'oklch(0.66 0.008 80)',
  hover:    'oklch(0.22 0.012 80)',
  active:   'oklch(0.24 0.014 80)',
}

interface AppSidebarProps {
  role: TenantRole
  userName?: string
  unreadNotifications?: number
}

export function AppSidebar({ role, userName, unreadNotifications }: AppSidebarProps) {
  const pathname = usePathname()
  const nav = role === 'platform_owner' ? platformNav : dashboardNav
  const isTenant = role !== 'platform_owner'

  return (
    <aside
      className="flex h-full w-56 flex-col border-r"
      style={{
        background: D.bg,
        borderColor: D.border,
        '--background':         D.bg,
        '--foreground':         D.fg,
        '--muted':              D.hover,
        '--muted-foreground':   D.fgMuted,
        '--border':             D.border,
        '--ink':                D.ink,
        '--primary':            D.ink,
        '--ring':               D.hover,
      } as React.CSSProperties}
    >
      {/* Header — wordmark + bell */}
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <FiiloLogo className="h-6 w-auto" style={{ color: D.fg } as React.CSSProperties} />
        {isTenant && (
          <NotificationsBell
            href="/dashboard/notifiche"
            unreadCount={unreadNotifications ?? 0}
            style={{ color: D.fg } as React.CSSProperties}
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          const isActive =
            item.href === '/dashboard' || item.href === '/platform'
              ? pathname === item.href
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100',
                !isActive && 'hover:bg-muted hover:text-foreground',
              )}
              style={isActive
                ? { background: D.active, color: D.ink }
                : { color: D.fgMuted }
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — UserMenu reads --ink / --foreground / --muted-foreground */}
      <div className="p-2" style={{ borderTop: `1px solid ${D.border}` }}>
        <UserMenu userName={userName ?? 'Utente'} role={role} />
      </div>
    </aside>
  )
}
