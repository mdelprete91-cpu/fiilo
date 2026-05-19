'use client'

import { useState, useTransition } from 'react'
import { Link as LinkIcon, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCustomerInvite } from '@/lib/actions/customer-invites'

interface Props {
  clientId: string
}

export function InvitaPortaleButton({ clientId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [link, setLink] = useState<string | null>(null)

  function onGenerate() {
    startTransition(async () => {
      const res = await createCustomerInvite(clientId)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setLink(res.data.link)
      if (res.data.whatsappSent) {
        toast.success('Invito inviato via WhatsApp.')
      } else {
        toast.success('Invito creato. Copia il link e condividilo.')
      }
    })
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiato negli appunti.')
    } catch {
      toast.error('Impossibile copiare. Selezionalo manualmente.')
    }
  }

  if (link) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-[260px] flex-1 rounded-md border border-input bg-background px-3 font-mono text-[11px]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
        >
          <Copy className="h-3.5 w-3.5" />
          Copia
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LinkIcon className="h-3.5 w-3.5" />
      )}
      Invita al portale
    </button>
  )
}
