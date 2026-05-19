'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDraftAction } from '@/lib/actions/newsletter'

interface FabricOption {
  id: string
  name: string
  mill: string | null
  color: string | null
  season: string | null
}

interface NewCampaignFormProps {
  fabrics: FabricOption[]
}

const OCCASIONS = [
  {
    value: 'new_fabric',
    label: 'Nuovo tessuto in atelier',
    hint: 'È arrivato un tessuto nuovo che vuoi raccontare ai clienti.',
  },
  {
    value: 'seasonal',
    label: 'Cambio di stagione',
    hint: 'Promemoria stagionale: tempo di pensare al guardaroba.',
  },
  {
    value: 'event',
    label: 'Evento speciale',
    hint: 'Matrimonio, festività, ricorrenza, occasione formale.',
  },
  {
    value: 'custom',
    label: 'Comunicazione personalizzata',
    hint: 'Un saluto, un aggiornamento, una novità di atelier.',
  },
] as const

export function NewCampaignForm({ fabrics }: NewCampaignFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await createDraftAction(fd)
      // createDraftAction redirects on success; if we get here it's an error
      if (res && !res.success) {
        setError(res.error)
        toast.error('Impossibile creare la campagna', { description: res.error })
      } else {
        // Redirect è andato, ma per sicurezza
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-border bg-card p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Titolo */}
      <div className="space-y-1.5">
        <Label
          htmlFor="title"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Titolo interno *
        </Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Es. Tessuti invernali Loro Piana"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Solo per te, per ritrovare la campagna. Non viene mostrato ai clienti.
        </p>
      </div>

      {/* Occasion */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Occasione *
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {OCCASIONS.map((o, i) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="occasion"
                value={o.value}
                defaultChecked={i === 0}
                className="mt-0.5 h-4 w-4 accent-primary"
                required
              />
              <div>
                <div className="text-sm font-medium text-foreground">{o.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{o.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Tessuto */}
      <div className="space-y-1.5">
        <Label
          htmlFor="featured_fabric_id"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Tessuto in evidenza
        </Label>
        <select
          id="featured_fabric_id"
          name="featured_fabric_id"
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">— Nessuno specifico —</option>
          {fabrics.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.mill ? ` — ${f.mill}` : ''}
              {f.color ? ` (${f.color})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Opzionale, ma raccomandato: l'AI scriverà di più, con dettagli concreti, se ha
          un tessuto da raccontare.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
        <p className="text-xs text-amber-900 dark:text-amber-200">
          <strong>Generazione AI:</strong> creare la bozza può richiedere alcuni minuti
          (~1 secondo per cliente). Riceverai un riepilogo al termine. Non chiudere la
          pagina.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generazione in corso…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Genera bozza
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push('/dashboard/marketing')}
        >
          Annulla
        </Button>
      </div>
    </form>
  )
}
