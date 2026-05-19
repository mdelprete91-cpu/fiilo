'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendCustomerMagicLinkAction } from '@/lib/actions/customer-auth'

const schema = z.object({ email: z.string().email('Email non valida') })
type FormData = z.infer<typeof schema>

export function CustomerLoginForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await sendCustomerMagicLinkAction({
        email: data.email,
        tenantSlug,
      })
      if (!res.success) {
        setError('root', { message: res.error })
        return
      }
      router.push(`/c/${tenantSlug}/login?sent=1`)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.it"
          className="h-11"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-11 w-full rounded-full text-sm font-medium"
        style={{ backgroundColor: 'var(--brand-color)' }}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Invia link di accesso
      </Button>
    </form>
  )
}
