'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ThreadColorSchema, type ThreadColorFormData } from '@/lib/validations/catalog'
import { upsertThreadColorAction, deleteThreadColorAction } from '@/lib/actions/catalog'
import type { ThreadColor } from '@/types/database'

export function ThreadColorsTable({ colors }: { colors: ThreadColor[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ThreadColor | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Eliminare questo colore?')) return
    startTransition(async () => { await deleteThreadColorAction(id) })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuovo colore
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Colore', 'Nome', 'Stato', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {colors.map((c) => (
              <tr key={c.id} className="group hover:bg-muted/20 transition-colors">
                <td className="pl-5 pr-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.hex_color }} />
                    <span className="font-mono text-xs text-muted-foreground">{c.hex_color}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium">{c.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${c.is_available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {c.is_available ? 'Disponibile' : 'Non disp.'}
                  </span>
                </td>
                <td className="pr-5 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => { setEditing(c); setOpen(true) }} className="rounded p-1 hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(c.id)} disabled={isPending} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!colors.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">Nessun colore filo nel catalogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? 'Modifica colore' : 'Nuovo colore filo'}</DialogTitle></DialogHeader>
          <ThreadColorForm color={editing} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ThreadColorForm({ color, onClose }: { color: ThreadColor | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ThreadColorFormData, any, ThreadColorFormData>({
    resolver: zodResolver(ThreadColorSchema) as any,
    defaultValues: color ? { name: color.name, hex_color: color.hex_color, is_available: color.is_available } : { hex_color: '#000000', is_available: true },
  })
  function onSubmit(data: ThreadColorFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.set(k, String(v)) })
      const result = await upsertThreadColorAction(color?.id ?? null, fd)
      if (result.success) onClose()
      else setError('root', { message: result.error })
    })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
      <F label="Nome *"><Input placeholder="Rosso Bordeaux" {...register('name')} /></F>
      <F label="Colore esadecimale *">
        <div className="flex gap-2 items-center">
          <input type="color" {...register('hex_color')} className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-1" />
          <Input placeholder="#C0392B" {...register('hex_color')} className="font-mono" />
        </div>
        {errors.hex_color && <p className="text-xs text-destructive">{errors.hex_color.message}</p>}
      </F>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('is_available')} /> Disponibile</label>
      <div className="flex gap-3"><Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{color ? 'Salva' : 'Aggiungi'}</Button><Button type="button" variant="outline" onClick={onClose}>Annulla</Button></div>
    </form>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>
}
