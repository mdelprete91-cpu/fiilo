'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/lib/actions/auth'

const schema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'La password è obbligatoria'),
})
type FormData = z.infer<typeof schema>

export function LoginForm() {
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
      fd.set('email', data.email)
      fd.set('password', data.password)
      const result = await loginAction(fd)
      if (!result.success) {
        setError('root', { message: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field error={errors.email?.message}>
        <Label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="mario@sartoria.it"
          autoComplete="email"
          className="h-11 rounded-md text-base md:text-sm"
          {...register('email')}
        />
      </Field>

      <Field error={errors.password?.message}>
        <Label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-11 rounded-md text-base md:text-sm"
          {...register('password')}
        />
      </Field>

      {errors.root && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-md text-sm font-medium"
        disabled={isPending}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Accedi
      </Button>

      <p className="pt-1 text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          Hai dimenticato la password?
        </Link>
      </p>
    </form>
  )
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
