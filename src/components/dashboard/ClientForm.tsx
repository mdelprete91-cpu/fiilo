'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClientSchema, type ClientFormData } from '@/lib/validations/client'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import type { Client } from '@/types/database'

interface ClientFormProps {
  client?: Client
}

export function ClientForm({ client }: ClientFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: client
      ? {
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          date_of_birth: client.date_of_birth ?? '',
          address: client.address ?? '',
          city: client.city ?? '',
          country: client.country ?? '',
          notes: client.notes ?? '',
        }
      : {},
  })

  function onSubmit(data: ClientFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.set(k, v ?? ''))

      if (client) {
        const result = await updateClientAction(client.id, fd)
        if (!result.success) {
          setError('root', { message: result.error })
          return
        }
        toast.success('Cliente salvato')
        router.push(`/dashboard/clienti/${client.id}`)
      } else {
        const result = await createClientAction(fd)
        if (result && !result.success) {
          setError('root', { message: result.error })
          return
        }
        toast.success('Cliente salvato')
      }
    })
  }

  function handleCancel() {
    router.push(client ? `/dashboard/clienti/${client.id}` : '/dashboard/clienti')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* Nome e cognome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome *" error={errors.first_name?.message}>
          <Input placeholder="Mario" required {...register('first_name')} />
        </Field>
        <Field label="Cognome *" error={errors.last_name?.message}>
          <Input placeholder="Rossi" required {...register('last_name')} />
        </Field>
      </div>

      {/* Contatti */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="mario.rossi@email.it" {...register('email')} />
        </Field>
        <Field label="Telefono" error={errors.phone?.message}>
          <Input placeholder="+39 333 1234567" {...register('phone')} />
        </Field>
      </div>

      {/* Data di nascita */}
      <Field label="Data di nascita" error={errors.date_of_birth?.message} className="max-w-xs">
        <Input type="date" {...register('date_of_birth')} />
      </Field>

      {/* Indirizzo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Indirizzo" error={errors.address?.message} className="sm:col-span-2">
          <Input placeholder="Via Roma 1" {...register('address')} />
        </Field>
        <Field label="Città" error={errors.city?.message}>
          <Input placeholder="Milano" {...register('city')} />
        </Field>
      </div>

      {/* Note */}
      <Field label="Note" error={errors.notes?.message}>
        <Textarea
          placeholder="Note interne sul cliente (preferenze, caratteristiche, ecc.)"
          rows={3}
          {...register('notes')}
        />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending
            ? 'Salvataggio...'
            : client
              ? 'Salva modifiche'
              : 'Crea cliente'}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={handleCancel}>
          Annulla
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
