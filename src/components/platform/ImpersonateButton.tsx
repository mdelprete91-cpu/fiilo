'use client'

import { useTransition } from 'react'
import { LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startImpersonationAction } from '@/lib/auth/impersonate'

export function ImpersonateButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      await startImpersonationAction(tenantId)
    })
  }

  return (
    <Button onClick={handle} disabled={isPending} variant="outline" size="sm">
      {isPending
        ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        : <LogIn className="mr-2 h-3.5 w-3.5" />}
      Entra nella dashboard di {tenantName}
    </Button>
  )
}
