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
  /**
   * Stato corrente dell'opt-in newsletter email del cliente (se presente in `newsletter_preferences`).
   * Default `false`: GDPR-compliant (no auto-opt-in).
   */
  newsletterEmailOptIn?: boolean
}

export function ClientForm({ client, newsletterEmailOptIn = false }: ClientFormProps) {
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
          newsletter_email_opt_in: newsletterEmailOptIn,
        }
      : {
          newsletter_email_opt_in: false,
        },
  })

  function onSubmit(data: ClientFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === 'boolean') {
          fd.set(k, v ? 'on' : 'off')
        } else {
          fd.set(k, (v ?? '') as string)
        }
      })

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

      {/* Consenso marketing */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            {...register('newsletter_email_opt_in')}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <div className="text-sm font-medium text-foreground">
              Voglio ricevere comunicazioni email dal mio sarto
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Solo newsletter occasionali su nuovi tessuti, eventi, novità di atelier.
              Niente spam. Annullabile in qualsiasi momento.
            </div>
          </div>
        </label>
      </div>

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
