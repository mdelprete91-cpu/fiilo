'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface Props {
  href: string
  unreadCount: number
  className?: string
  /** Override icon color via inline style — used in the dark sidebar header. */
  style?: React.CSSProperties
}

/**
 * Compact bell trigger sitting in the sidebar header. Click navigates to the
 * notifications page; an unread count appears as a small pill on the
 * top-right of the icon.
 */
export function NotificationsBell({ href, unreadCount, className, style }: Props) {
  const hasUnread = unreadCount > 0
  const display = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Link
      href={href}
      aria-label={hasUnread ? `Notifiche, ${unreadCount} non lette` : 'Notifiche'}
      className={cn(
        'relative inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className,
      )}
      style={style}
    >
      <Bell className="size-4" />
      {hasUnread && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none tabular-nums text-accent-foreground"
        >
          {display}
        </span>
      )}
    </Link>
  )
}
