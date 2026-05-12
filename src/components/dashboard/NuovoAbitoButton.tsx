'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { createGarmentAction } from '@/lib/actions/garments'

export function NuovoAbitoButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handle() {
    startTransition(async () => {
      const result = await createGarmentAction(clientId)
      if (result.success) {
        router.push(`/dashboard/clienti/${clientId}/abiti/${result.data.id}?from=clienti`)
      } else {
        alert(`Errore: ${result.error}`)
      }
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97] disabled:opacity-60 will-change-transform"
    >
      {isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Plus className="h-3.5 w-3.5" />}
      Nuovo abito
    </button>
  )
}
