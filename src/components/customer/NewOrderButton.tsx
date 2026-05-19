'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createCustomerGarmentAction } from '@/lib/actions/customer-orders'

export function NewOrderButton({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const res = await createCustomerGarmentAction()
      if (!res.success) {
        toast.error(res.error)
        return
      }
      router.push(`/c/${tenantSlug}/nuovo-ordine/${res.data.id}`)
    })
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isPending}
      size="lg"
      className="h-11 rounded-full px-5 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--brand-color)' }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Configura nuovo abito
    </Button>
  )
}
