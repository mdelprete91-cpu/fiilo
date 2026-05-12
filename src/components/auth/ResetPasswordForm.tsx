'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePasswordAction } from '@/lib/actions/auth'

const schema = z.object({
  password: z.string().min(8, 'Almeno 8 caratteri'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Le password non coincidono',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('password', data.password)
      fd.set('confirm', data.confirm)
      const result = await updatePasswordAction(fd)
      if (!result.success) {
        setError('root', { message: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-ink">
          Nuova password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          className="h-11 rounded-md text-base md:text-sm"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm" className="text-sm font-medium text-ink">
          Conferma password
        </Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          className="h-11 rounded-md text-base md:text-sm"
          {...register('confirm')}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-full text-sm font-medium"
        disabled={isPending}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Salva password
      </Button>
    </form>
  )
}
