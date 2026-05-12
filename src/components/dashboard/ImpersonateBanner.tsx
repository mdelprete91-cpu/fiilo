'use client'

import { useTransition } from 'react'
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react'
import { stopImpersonationAction } from '@/lib/auth/impersonate'

export function ImpersonateBanner({ tenantName }: { tenantName: string }) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      await stopImpersonationAction()
    })
  }

  return (
    <div className="flex shrink-0 items-center justify-between bg-amber-500 px-6 py-2 text-sm font-medium text-white dark:bg-amber-700 dark:text-amber-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        <span>
          Modalità super admin · stai visualizzando la dashboard di{' '}
          <strong>{tenantName}</strong>
        </span>
      </div>
      <button
        onClick={handle}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        Esci
      </button>
    </div>
  )
}
