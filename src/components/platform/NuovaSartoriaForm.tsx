'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenantAction } from '@/lib/actions/tenants'

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', description: 'Fino a 2 utenti, funzioni base' },
  { value: 'professional', label: 'Professional', description: 'Utenti illimitati, PDF, email' },
  { value: 'enterprise', label: 'Enterprise', description: 'Multi-location, API, supporto dedicato' },
]

export function NuovaSartoriaForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(false)

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createTenantAction(fd)
      if (result.success) {
        router.push(`/platform/tenants/${result.data.id}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/platform')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Torna alla lista
      </button>

      {error && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Dati sartoria */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Dati sartoria
          </p>
        </div>
        <div className="p-5 space-y-5">
          <F label="Nome sartoria *">
            <Input
              name="name"
              required
              placeholder="Sartoria Belmonte"
              onChange={(e) => {
                if (!slugManual) {
                  const slugInput = e.currentTarget.form?.elements.namedItem('slug') as HTMLInputElement
                  if (slugInput) slugInput.value = generateSlug(e.target.value)
                }
              }}
            />
          </F>

          <F label="Slug URL *" hint="Solo lettere minuscole, numeri e trattini">
            <Input
              name="slug"
              required
              placeholder="sartoria-belmonte"
              pattern="[a-z0-9-]+"
              onChange={() => setSlugManual(true)}
            />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Email">
              <Input name="email" type="email" placeholder="info@sartoria.it" />
            </F>
            <F label="Telefono">
              <Input name="phone" placeholder="+39 02 1234567" />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Indirizzo">
              <Input name="address" placeholder="Via Roma 1" />
            </F>
            <F label="Città">
              <Input name="city" placeholder="Milano" />
            </F>
          </div>

          <F
            label="Sito web della sartoria"
            hint="Se fornito, filo importa automaticamente logo, colore brand e catalogo dal sito."
          >
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
              <Input
                name="website_url"
                type="text"
                placeholder="esempio.it"
                className="pl-9"
              />
            </div>
          </F>

          <F label="Colore brand di fallback" hint="Usato solo se il sito non viene fornito o l'auto-import non trova un colore.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brand_color"
                defaultValue="#1a1a1a"
                className="h-9 w-14 cursor-pointer rounded-sm border border-input bg-background p-1"
              />
              <span className="text-xs text-muted-foreground">Colore principale dell'interfaccia</span>
            </div>
          </F>

          <F label="Piano *">
            <div className="grid grid-cols-3 gap-3">
              {PLAN_OPTIONS.map((p) => (
                <label key={p.value} className="cursor-pointer">
                  <input type="radio" name="plan" value={p.value} defaultChecked={p.value === 'starter'} className="sr-only peer" />
                  <div className="rounded-sm border border-border bg-card px-3 py-2.5 text-left transition-colors peer-checked:border-primary peer-checked:bg-primary/5">
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </F>
        </div>
      </div>

      {/* Admin iniziale */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Amministratore
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verrà creato un account con accesso da tenant admin.
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <F label="Nome completo">
            <Input name="admin_name" placeholder="Marco Belmonte" />
          </F>

          <F label="Email *">
            <Input name="email" type="email" required placeholder="marco@sartoria.it" />
          </F>

          <F label="Password temporanea *">
            <Input name="password" type="password" required minLength={8} placeholder="Min. 8 caratteri" />
          </F>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Creazione in corso…' : 'Crea sartoria'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/platform')}>
          Annulla
        </Button>
        {isPending && (
          <p className="text-xs text-muted-foreground">
            Se hai inserito un sito, l&apos;analisi può richiedere fino a 30 secondi.
          </p>
        )}
      </div>
    </form>
  )
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
