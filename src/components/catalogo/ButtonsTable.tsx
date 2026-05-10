'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonSchema, type ButtonFormData } from '@/lib/validations/catalog'
import { upsertButtonAction, deleteButtonAction } from '@/lib/actions/catalog'
import type { Button as ButtonType } from '@/types/database'

const MATERIAL_LABELS: Record<string, string> = {
  horn: 'Corno', corozo: 'Corozo', mother_of_pearl: 'Madreperla',
  plastic: 'Plastica', metal: 'Metallo',
}

export function ButtonsTable({ buttons }: { buttons: ButtonType[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ButtonType | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Eliminare questo bottone?')) return
    startTransition(async () => { await deleteButtonAction(id) })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuovo bottone
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Nome', 'Materiale', 'Colore', 'Finitura', 'Stato', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {buttons.map((b) => (
              <tr key={b.id} className="group hover:bg-muted/20 transition-colors">
                <td className="pl-5 pr-4 py-3.5 font-medium">{b.name}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{MATERIAL_LABELS[b.material] ?? b.material}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{b.color ?? '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{b.finish ?? '—'}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${b.is_available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {b.is_available ? 'Disponibile' : 'Non disp.'}
                  </span>
                </td>
                <td className="pr-5 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => { setEditing(b); setOpen(true) }} className="rounded p-1 hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(b.id)} disabled={isPending} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!buttons.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">Nessun bottone nel catalogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? 'Modifica bottone' : 'Nuovo bottone'}</DialogTitle></DialogHeader>
          <ButtonForm button={editing} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ButtonForm({ button, onClose }: { button: ButtonType | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ButtonFormData, any, ButtonFormData>({
    resolver: zodResolver(ButtonSchema) as any,
    defaultValues: button ? { name: button.name, material: button.material, color: button.color ?? '', finish: button.finish ?? '', is_available: button.is_available } : { material: 'corozo', is_available: true },
  })
  function onSubmit(data: ButtonFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.set(k, String(v)) })
      const result = await upsertButtonAction(button?.id ?? null, fd)
      if (result.success) onClose()
      else setError('root', { message: result.error })
    })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
      <F label="Nome *"><Input {...register('name')} /></F>
      <F label="Materiale *">
        <select {...register('material')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {Object.entries(MATERIAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Colore"><Input {...register('color')} /></F>
        <F label="Finitura"><Input placeholder="lucido, opaco, naturale" {...register('finish')} /></F>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('is_available')} /> Disponibile</label>
      <div className="flex gap-3"><Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{button ? 'Salva' : 'Aggiungi'}</Button><Button type="button" variant="outline" onClick={onClose}>Annulla</Button></div>
    </form>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>
}
