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
    <div className="flex items-center justify-between bg-amber-500 px-6 py-2 text-sm font-medium text-white shrink-0">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        <span>Modalità super admin — stai visualizzando la dashboard di <strong>{tenantName}</strong></span>
      </div>
      <button
        onClick={handle}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md border border-white/40 bg-white/10 px-3 py-1 hover:bg-white/20 transition-colors"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Esci
      </button>
    </div>
  )
}
