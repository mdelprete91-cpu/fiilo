'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addStaffMemberAction, removeStaffMemberAction } from '@/lib/actions/tenants'

interface Member {
  roleId: string
  userId: string
  role: string
  fullName: string | null
  email: string
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Admin', tenant_staff: 'Staff',
}

const ROLE_STYLE: Record<string, React.CSSProperties> = {
  tenant_admin: { background: 'oklch(0.93 0.04 250)', color: 'oklch(0.35 0.07 250)' },
  tenant_staff: { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.55 0.02 85)' },
}

export function TenantStaffPanel({ tenantId, members }: { tenantId: string; members: Member[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addStaffMemberAction(tenantId, fd)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  function handleRemove(roleId: string) {
    if (!confirm('Rimuovere questo membro dallo staff?')) return
    startTransition(async () => {
      await removeStaffMemberAction(roleId, tenantId)
    })
  }

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Staff</p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Aggiungi membro
        </button>
      </div>

      <ul className="divide-y divide-border">
        {members.map((m) => (
          <li key={m.roleId} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink shrink-0">
                {m.fullName
                  ? <span className="text-xs font-bold text-background uppercase">{m.fullName.slice(0, 1)}</span>
                  : <UserCircle2 className="h-4 w-4 text-background/60" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{m.fullName ?? m.email}</p>
                {m.fullName && <p className="text-xs text-muted-foreground">{m.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] px-2.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide"
                style={ROLE_STYLE[m.role] ?? ROLE_STYLE['tenant_staff']}
              >
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
              <button
                onClick={() => handleRemove(m.roleId)}
                disabled={isPending}
                className="rounded-sm p-1.5 hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </li>
        ))}

        {members.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground mb-1">Nessun membro staff</p>
            <p className="text-xs text-muted-foreground">Aggiungi il primo membro per questa sartoria.</p>
          </li>
        )}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Aggiungi membro staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            {error && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <F label="Nome completo">
              <Input name="full_name" placeholder="Mario Rossi" />
            </F>
            <F label="Email *">
              <Input name="email" type="email" required placeholder="mario@sartoria.it" />
            </F>
            <F label="Password temporanea *">
              <Input name="password" type="password" required minLength={8} placeholder="Min. 8 caratteri" />
            </F>
            <F label="Ruolo">
              <select
                name="role"
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="tenant_staff">Staff</option>
                <option value="tenant_admin">Admin</option>
              </select>
            </F>
            <div className="flex gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aggiungi
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
