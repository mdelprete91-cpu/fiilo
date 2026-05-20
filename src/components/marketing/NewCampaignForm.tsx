'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, FileText } from 'lucide-react'
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

export interface TemplateOption {
  id: string
  slug: string
  name: string
  occasion: 'new_fabric' | 'seasonal' | 'event' | 'custom'
  description: string | null
  is_system: boolean
  subject_template: string
  incipit_template: string
  gancio_template: string
  chiusura_template: string
  cta_label: string | null
}

interface NewCampaignFormProps {
  fabrics: FabricOption[]
  templates: TemplateOption[]
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

export function NewCampaignForm({ fabrics, templates }: NewCampaignFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [occasion, setOccasion] = useState<TemplateOption['occasion']>('new_fabric')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [useAi, setUseAi] = useState(false)
  const router = useRouter()

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.occasion === occasion),
    [templates, occasion],
  )

  // Auto-seleziona il primo template quando cambia l'occasione (o al primo render)
  useEffect(() => {
    const first = filteredTemplates[0]
    if (first) {
      if (!templateId || !filteredTemplates.some((t) => t.id === templateId)) {
        setTemplateId(first.id)
      }
    } else {
      setTemplateId(null)
    }
  }, [filteredTemplates, templateId])

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null

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
        toast.error('Impossibile creare la comunicazione', { description: res.error })
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
          Solo per te, per ritrovare la comunicazione. Non viene mostrato ai clienti.
        </p>
      </div>

      {/* Occasion */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Occasione *
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {OCCASIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="occasion"
                value={o.value}
                checked={occasion === o.value}
                onChange={() => setOccasion(o.value as TemplateOption['occasion'])}
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

      {/* Template */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Template
          </Label>
          {filteredTemplates.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Nessun template per questa occasione
            </span>
          )}
        </div>
        {filteredTemplates.length > 0 && (
          <>
            <input type="hidden" name="template_id" value={templateId ?? ''} />
            <div className="space-y-2">
              {filteredTemplates.map((t) => {
                const isSelected = t.id === templateId
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                        {t.is_system && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            sistema
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          selezionato
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground">{t.description}</p>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedTemplate && (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs space-y-2 text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Oggetto:</span>{' '}
                  {selectedTemplate.subject_template}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Apertura:</span>{' '}
                  {selectedTemplate.incipit_template}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Corpo:</span>{' '}
                  {selectedTemplate.gancio_template}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Chiusura:</span>{' '}
                  {selectedTemplate.chiusura_template}
                </div>
                <p className="text-[10px] text-muted-foreground/80 pt-1 border-t border-border">
                  Le variabili tipo <code>{`{{client_first_name}}`}</code> e{' '}
                  <code>{`{{fabric_name}}`}</code> vengono sostituite per ogni cliente.
                </p>
              </div>
            )}
          </>
        )}
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

      {/* Toggle AI */}
      <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer transition-colors hover:bg-muted/30 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
        <input
          type="checkbox"
          name="use_ai"
          value="on"
          checked={useAi}
          onChange={(e) => setUseAi(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Personalizza con AI (opzionale)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Se attivo, Claude rielabora il template per ogni cliente in base alle sue preferenze.
            Richiede <code>ANTHROPIC_API_KEY</code> configurata. Più lento (~1s per cliente) e
            con un piccolo costo (~€0.0001 a destinatario). Lascia spento per inviare il template
            uguale a tutti, gratis e istantaneo.
          </p>
        </div>
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || (!templateId && !useAi)}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generazione in corso…
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
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
