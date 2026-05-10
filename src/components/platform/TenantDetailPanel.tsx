'use client'

import { useState, useTransition } from 'react'
import { Pencil, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTenantAction, toggleTenantActiveAction } from '@/lib/actions/tenants'
import type { Tenant } from '@/types/database'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise',
}

export function TenantDetailPanel({ tenant }: { tenant: Tenant }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateTenantAction(tenant.id, fd)
      if (result.success) setEditing(false)
      else setError(result.error)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleTenantActiveAction(tenant.id, !tenant.is_active)
    })
  }

  if (editing) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">
          Modifica sartoria
        </p>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <form onSubmit={handleUpdate} className="space-y-3">
          <F label="Nome *"><Input name="name" defaultValue={tenant.name} required /></F>
          <F label="Slug *"><Input name="slug" defaultValue={tenant.slug} required pattern="[a-z0-9-]+" /></F>
          <F label="Email"><Input name="email" type="email" defaultValue={tenant.email ?? ''} /></F>
          <F label="Telefono"><Input name="phone" defaultValue={tenant.phone ?? ''} /></F>
          <F label="Indirizzo"><Input name="address" defaultValue={tenant.address ?? ''} /></F>
          <F label="Città"><Input name="city" defaultValue={tenant.city ?? ''} /></F>
          <F label="Piano">
            <select
              name="plan"
              defaultValue={tenant.plan}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </F>
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salva
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" /> Annulla
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Dettagli
        </p>
        <button onClick={() => setEditing(true)} className="rounded-sm p-1.5 hover:bg-muted transition-colors">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="font-heading text-base text-ink leading-tight">{tenant.name}</p>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{tenant.slug}</p>
        </div>

        <dl className="space-y-2.5 text-sm">
          <Row label="Piano" value={PLAN_LABELS[tenant.plan] ?? tenant.plan} />
          {tenant.email && <Row label="Email" value={tenant.email} />}
          {tenant.phone && <Row label="Telefono" value={tenant.phone} />}
          {tenant.city && <Row label="Città" value={tenant.city} />}
          <Row label="Stato" value={tenant.is_active ? 'Attiva' : 'Inattiva'} />
          <Row label="Creata" value={new Date(tenant.created_at).toLocaleDateString('it-IT')} />
        </dl>

        {tenant.brand_color && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm border border-border" style={{ backgroundColor: tenant.brand_color }} />
            <span className="font-mono text-xs text-muted-foreground">{tenant.brand_color}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <Button
          size="sm"
          variant={tenant.is_active ? 'outline' : 'default'}
          onClick={handleToggle}
          disabled={isPending}
          className={tenant.is_active ? 'text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10' : ''}
        >
          {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {tenant.is_active ? 'Disattiva sartoria' : 'Riattiva sartoria'}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
