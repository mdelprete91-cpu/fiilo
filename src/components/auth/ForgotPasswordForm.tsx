'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordResetAction } from '@/lib/actions/auth'

const schema = z.object({
  email: z.string().email('Email non valida'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', data.email)
      await requestPasswordResetAction(fd)
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Controlla la tua casella</p>
            <p className="text-xs text-muted-foreground">
              Se l&apos;email è registrata riceverai un link per reimpostare la password entro
              qualche minuto. Controlla anche la cartella spam.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="mario@sartoria.it"
          autoComplete="email"
          autoFocus
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Invia link
      </Button>
    </form>
  )
}
