'use client'

import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'
import type { TenantRole } from '@/types/database'

interface TopBarProps {
  role: TenantRole
  tenantName?: string
  userName?: string
  title?: string
  subtitle?: string
}

export function TopBar({ role, tenantName, userName, title, subtitle }: TopBarProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Mobile hamburger — hidden on desktop */}
      <Sheet>
        <SheetTrigger className="lg:hidden mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Menu className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Apri menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0">
          <AppSidebar role={role} tenantName={tenantName} userName={userName} />
        </SheetContent>
      </Sheet>

      {title && (
        <div>
          <h1 className="font-heading text-3xl text-ink leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  )
}
