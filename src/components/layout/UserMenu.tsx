'use client'

import { useRouter } from 'next/navigation'
import { User, Settings, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { logoutAction } from '@/lib/actions/auth'
import type { TenantRole } from '@/types/database'
import { ThemeToggle } from './ThemeToggle'

const ROLE_LABEL: Record<TenantRole, string> = {
  platform_owner: 'Platform Owner',
  tenant_admin: 'Admin',
  tenant_staff: 'Staff',
  customer: 'Cliente',
}

interface UserMenuProps {
  userName: string
  role: TenantRole
}

export function UserMenu({ userName, role }: UserMenuProps) {
  const router = useRouter()
  const settingsHref = role === 'platform_owner' ? '/platform/settings' : '/dashboard/settings'
  const initial = userName?.[0]?.toUpperCase() ?? '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-background">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">{userName}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABEL[role] ?? role}</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" sideOffset={6} className="rounded-sm p-1.5">
        {/* User identity header */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-0.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-background">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ROLE_LABEL[role] ?? role}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-sm px-2 py-2 text-xs"
          onClick={() => router.push(settingsHref)}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          Il mio profilo
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-sm px-2 py-2 text-xs"
          onClick={() => router.push(settingsHref)}
        >
          <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          Impostazioni
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <ThemeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-2.5 rounded-sm px-2 py-2 text-xs"
          onClick={() => logoutAction()}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
