'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FiloLogo } from './FiloLogo'
import { UserMenu } from './UserMenu'
import type { TenantRole } from '@/types/database'

interface NavItem {
  label: string
  href: string
  badge?: number
}

const dashboardNav: NavItem[] = [
  { label: 'Panoramica', href: '/dashboard' },
  { label: 'Produzione', href: '/dashboard/produzione' },
  { label: 'Clienti', href: '/dashboard/clienti' },
  { label: 'Catalogo', href: '/dashboard/catalogo' },
  { label: 'Notifiche', href: '/dashboard/notifiche' },
  { label: 'Impostazioni', href: '/dashboard/settings' },
]

const platformNav: NavItem[] = [
  { label: 'Dashboard', href: '/platform' },
  { label: 'Sartorie', href: '/platform/tenants' },
  { label: 'Impostazioni', href: '/platform/settings' },
]

/*
 * Dark sidebar palette — warm brown-black, like a leather ledger spine
 * next to an open cream page. Not cold, not blue-tech.
 */
const D = {
  bg:       'oklch(0.16 0.012 80)',
  border:   'oklch(0.24 0.010 80)',
  ink:      'oklch(0.94 0.006 80)',  /* logo mark bg · avatar bg · active text */
  fg:       'oklch(0.92 0.008 80)',  /* primary labels */
  fgMuted:  'oklch(0.50 0.008 80)',  /* inactive nav */
  hover:    'oklch(0.22 0.012 80)',  /* hover bg */
  active:   'oklch(0.24 0.014 80)', /* active item bg */
}

interface AppSidebarProps {
  role: TenantRole
  userName?: string
  unreadNotifications?: number
}

export function AppSidebar({ role, userName, unreadNotifications }: AppSidebarProps) {
  const pathname = usePathname()
  const nav = role === 'platform_owner'
    ? platformNav
    : dashboardNav.map((item) =>
        item.href === '/dashboard/notifiche'
          ? { ...item, badge: unreadNotifications ?? 0 }
          : item
      )

  return (
    <aside
      className="flex h-full w-56 flex-col border-r"
      style={{
        background: D.bg,
        borderColor: D.border,
        /*
         * Scope dark CSS variables: child components using bg-muted,
         * text-foreground, etc. pick up dark values automatically.
         * Portal-rendered elements (dropdowns) are unaffected.
         */
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
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <FiloLogo className="h-6 w-auto" style={{ color: D.fg } as React.CSSProperties} />
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
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100',
                !isActive && 'hover:bg-muted hover:text-foreground'
              )}
              style={isActive
                ? { background: D.active, color: D.ink }
                : { color: D.fgMuted }
              }
            >
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums leading-none"
                  style={{ background: 'oklch(0.50 0.18 250)', color: '#fff' }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
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
