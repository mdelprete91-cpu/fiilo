'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LiningSchema, type LiningFormData } from '@/lib/validations/catalog'
import { upsertLiningAction, deleteLiningAction } from '@/lib/actions/catalog'
import type { Lining } from '@/types/database'

export function LiningsTable({ linings }: { linings: Lining[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lining | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Eliminare questa fodera?')) return
    startTransition(async () => { await deleteLiningAction(id) })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuova fodera
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Nome', 'Materiale', 'Colore', 'Stato', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linings.map((l) => (
              <tr key={l.id} className="group hover:bg-muted/20 transition-colors">
                <td className="pl-5 pr-4 py-3.5 font-medium">{l.name}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{l.material ?? '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{l.color ?? '—'}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${l.is_available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {l.is_available ? 'Disponibile' : 'Non disp.'}
                  </span>
                </td>
                <td className="pr-5 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => { setEditing(l); setOpen(true) }} className="rounded p-1 hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(l.id)} disabled={isPending} className="rounded p-1 hover:bg-muted">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!linings.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">Nessuna fodera nel catalogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? 'Modifica fodera' : 'Nuova fodera'}</DialogTitle></DialogHeader>
          <LiningForm lining={editing} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LiningForm({ lining, onClose }: { lining: Lining | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LiningFormData, any, LiningFormData>({
    resolver: zodResolver(LiningSchema) as any,
    defaultValues: lining ? { name: lining.name, color: lining.color ?? '', material: lining.material ?? '', is_available: lining.is_available } : { is_available: true },
  })
  function onSubmit(data: LiningFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.set(k, String(v)) })
      const result = await upsertLiningAction(lining?.id ?? null, fd)
      if (result.success) onClose()
      else setError('root', { message: result.error })
    })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
      <F label="Nome *"><Input {...register('name')} /></F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Materiale"><Input placeholder="Bemberg, Seta…" {...register('material')} /></F>
        <F label="Colore"><Input {...register('color')} /></F>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('is_available')} /> Disponibile</label>
      <div className="flex gap-3"><Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{lining ? 'Salva' : 'Aggiungi'}</Button><Button type="button" variant="outline" onClick={onClose}>Annulla</Button></div>
    </form>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>
}
