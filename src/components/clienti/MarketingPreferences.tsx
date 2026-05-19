'use client'

import { useState, useTransition } from 'react'
import { Loader2, MessageCircleOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { setOptOutAction } from '@/lib/actions/fabric-announcement'

interface Props {
  clientId: string
  initialOptout: boolean
  optoutAt?: string | null
}

export function MarketingPreferences({
  clientId,
  initialOptout,
  optoutAt,
}: Props) {
  const [optout, setOptout] = useState(initialOptout)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(next: boolean) {
    setError(null)
    setOptout(next)  // optimistic
    startTransition(async () => {
      const fd = new FormData()
      fd.set('clientId', clientId)
      // optout in UI = NOT subscribed: switch ON significa "riceve notifiche"
      // → marketing_optout = !next
      fd.set('optout', String(!next))
      const res = await setOptOutAction(fd)
      if (!res.success) {
        setError(res.error)
        setOptout(!next)  // revert
      }
    })
  }

  const subscribed = !optout

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <MessageCircleOff className="h-3.5 w-3.5" /> Marketing WhatsApp
        </h3>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="px-5 py-4 space-y-3">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              Riceve notifiche WhatsApp per nuovi tessuti
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subscribed
                ? 'Il cliente può ricevere annunci di nuovi tessuti che potrebbero interessargli.'
                : 'Il cliente ha disattivato gli annunci. Non riceverà nuovi messaggi marketing.'}
              {!subscribed && optoutAt && (
                <> Dal {new Date(optoutAt).toLocaleDateString('it-IT')}.</>
              )}
            </p>
          </div>
          <Switch
            checked={subscribed}
            disabled={pending}
            onCheckedChange={toggle}
            aria-label="Riceve notifiche marketing"
          />
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
