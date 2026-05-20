'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Loader2, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FabricSchema, type FabricFormData } from '@/lib/validations/catalog'
import { upsertFabricAction, deleteFabricAction } from '@/lib/actions/catalog'
import type { Fabric } from '@/types/database'

const PATTERN_LABELS: Record<string, string> = {
  solid: 'Tinta unita', striped: 'Rigato', checked: 'Quadrato', herringbone: 'Spigato',
  houndstooth: 'Pied-de-poule', plaid: 'Plaid', windowpane: 'Principe di Galles',
  paisley: 'Paisley', other: 'Altro',
}
const SEASON_LABELS: Record<string, string> = {
  spring_summer: 'P/E', autumn_winter: 'A/I', all_season: 'Tutto anno',
}

export function FabricsTable({ fabrics }: { fabrics: Fabric[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Fabric | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() { setEditing(null); setOpen(true) }
  function openEdit(f: Fabric) { setEditing(f); setOpen(true) }

  function handleDelete(id: string) {
    if (!confirm('Eliminare questo tessuto?')) return
    startTransition(async () => { await deleteFabricAction(id) })
  }

  if (!fabrics.length) {
    return (
      <div>
        <Empty className="rounded-xl border border-dashed border-border bg-card py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>Nessun tessuto nel catalogo</EmptyTitle>
            <EmptyDescription>
              Inizia caricando i tuoi tessuti.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Aggiungi tessuto
            </Button>
          </EmptyContent>
        </Empty>

        <Dialog open={open} onOpenChange={setOpen}>
          <FabricFormDialog fabric={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuovo tessuto
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Nome', 'Brand', 'Composizione', 'Peso', 'Colore', 'Pattern', 'Stagione', 'Prezzo/m', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fabrics.map((f) => (
              <tr key={f.id} className="group hover:bg-muted/20 transition-colors">
                <td className="pl-5 pr-4 py-3.5 font-medium text-foreground">
                  {f.name}
                  {!f.is_available && <span className="ml-1.5 text-[10px] text-muted-foreground">(non disp.)</span>}
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.mill ?? '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground max-w-[160px] truncate">{f.composition ?? '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.weight_grams ? `${f.weight_grams}g` : '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.color ?? '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.pattern ? PATTERN_LABELS[f.pattern] : '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.season ? SEASON_LABELS[f.season] : '—'}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.price_per_meter ? `€${f.price_per_meter}` : '—'}</td>
                <td className="pr-5 py-3.5">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <Link
                      href={`/dashboard/catalogo/${f.id}/annuncio`}
                      className="rounded p-1 hover:bg-muted transition-colors"
                      title="Annuncia ai clienti"
                    >
                      <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <button onClick={() => openEdit(f)} className="rounded p-1 hover:bg-muted transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(f.id)} disabled={isPending} className="rounded p-1 hover:bg-muted transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <FabricFormDialog fabric={editing} onClose={() => setOpen(false)} />
      </Dialog>
    </div>
  )
}

function FabricFormDialog({ fabric, onClose }: { fabric: Fabric | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<FabricFormData, any, FabricFormData>({
    resolver: zodResolver(FabricSchema) as any,
    defaultValues: fabric ? {
      name: fabric.name, mill: fabric.mill ?? '', code: fabric.code ?? '',
      composition: fabric.composition ?? '', weight_grams: fabric.weight_grams ?? undefined,
      color: fabric.color ?? '', pattern: fabric.pattern ?? undefined,
      price_per_meter: fabric.price_per_meter ?? undefined, season: fabric.season ?? undefined,
      is_available: fabric.is_available,
      external_url: ((fabric as unknown as { external_url?: string | null }).external_url) ?? '',
    } : { is_available: true, external_url: '' },
  })

  function onSubmit(data: FabricFormData) {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.set(k, String(v)) })
      const result = await upsertFabricAction(fabric?.id ?? null, fd)
      if (result.success) onClose()
      else setError('root', { message: result.error })
    })
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-heading text-xl">{fabric ? 'Modifica tessuto' : 'Nuovo tessuto'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
        <div className="grid grid-cols-2 gap-4">
          <F label="Nome *"><Input {...register('name')} /></F>
          <F label="Brand"><Input placeholder="Loro Piana, VBC…" {...register('mill')} /></F>
          <F label="Codice"><Input {...register('code')} /></F>
          <F label="Composizione"><Input placeholder="100% Lana Vergine" {...register('composition')} /></F>
          <F label="Peso (g/m²)"><Input type="number" {...register('weight_grams')} /></F>
          <F label="Colore"><Input {...register('color')} /></F>
          <F label="Pattern">
            <select {...register('pattern')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Seleziona —</option>
              {Object.entries(PATTERN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Stagione">
            <select {...register('season')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Seleziona —</option>
              {Object.entries(SEASON_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Prezzo al metro (€)"><Input type="number" step="0.01" {...register('price_per_meter')} /></F>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Link alla pagina del prodotto sul tuo sito
          </Label>
          <Input
            type="url"
            placeholder="https://sartoria.it/tessuti/loro-piana-flannel-250g"
            {...register('external_url')}
          />
          <p className="text-[11px] text-muted-foreground/80">
            Esempio: https://sartoria.it/tessuti/loro-piana-flannel-250g — sarà il bottone primario nella newsletter quando promuovi questo tessuto.
          </p>
          {errors.external_url && (
            <p className="text-xs text-destructive">{errors.external_url.message}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_available')} className="rounded" />
          Disponibile
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {fabric ? 'Salva' : 'Aggiungi'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
        </div>
      </form>
    </DialogContent>
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
