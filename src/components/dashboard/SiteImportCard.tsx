'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Globe, Loader2, Sparkles, Check, X } from 'lucide-react'
import {
  importFromSiteUrlAction,
  applyImportPreviewAction,
  type ImportPreview,
} from '@/lib/actions/onboarding-from-site'
import { updateMyWebsiteUrlAction } from '@/lib/actions/tenants'

interface Props {
  tenantName: string
  currentWebsiteUrl: string | null
  currentLogoUrl: string | null
  currentBrandColor: string | null
}

export function SiteImportCard({
  tenantName,
  currentWebsiteUrl,
  currentLogoUrl,
  currentBrandColor,
}: Props) {
  const [urlInput, setUrlInput] = useState(currentWebsiteUrl ?? '')
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [logoOverride, setLogoOverride] = useState<string | null>(null)
  const [colorOverride, setColorOverride] = useState<string | null>(null)

  function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPreview(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await importFromSiteUrlAction(fd)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setPreview(res.data)
      setSelectedItems(new Set(res.data.catalogItems.map((c) => c.url)))
      setLogoOverride(res.data.analysis.logo_url)
      setColorOverride(res.data.analysis.brand_color_hex)
      toast.success('Sito analizzato. Verifica e applica.')
    })
  }

  async function handleSaveWebsiteOnly() {
    const fd = new FormData()
    fd.set('website_url', urlInput)
    startTransition(async () => {
      const res = await updateMyWebsiteUrlAction(fd)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success('Sito web salvato.')
    })
  }

  function handleApply() {
    if (!preview) return
    const filtered = preview.catalogItems.filter((c) => selectedItems.has(c.url))
    startTransition(async () => {
      const res = await applyImportPreviewAction({
        websiteUrl: preview.websiteUrl,
        logoUrl: logoOverride,
        brandColor: colorOverride,
        officialName: preview.analysis.official_name,
        catalogItems: filtered,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success(`Importazione completata. ${filtered.length} pagine catalogo salvate.`)
      setPreview(null)
    })
  }

  function toggleItem(url: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-6 pt-5 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Importa dal tuo sito
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Inserisci l&apos;URL del sito della tua sartoria. filo legge automaticamente
          logo, colori e catalogo per impostare il tutto al posto tuo.
        </p>
      </div>

      <div className="px-6 py-6 space-y-5">
        <form onSubmit={handleImport} className="space-y-3">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            URL del sito
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="website_url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="esempio.it o https://www.esempio.it"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !urlInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isPending && !preview ? 'Analisi…' : 'Importa'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground/80">
            L&apos;analisi richiede ~10-20 secondi. Puoi anche solo salvare il link senza importare nulla.
          </p>
          {!preview && (
            <button
              type="button"
              onClick={handleSaveWebsiteOnly}
              disabled={isPending || !urlInput.trim() || urlInput === (currentWebsiteUrl ?? '')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Salva solo il link senza analizzare
            </button>
          )}
        </form>

        {preview && (
          <div className="space-y-5 rounded-lg border border-primary/20 bg-primary/5 p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                Anteprima importazione
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verifica i dati estratti dal sito. Puoi modificare logo e colore manualmente
                prima di applicare.
              </p>
            </div>

            {/* Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Logo rilevato
                </p>
                <div className="flex h-20 w-full items-center justify-center rounded-md border border-border bg-white p-3">
                  {logoOverride ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoOverride}
                      alt={preview.analysis.official_name}
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Nessun logo trovato</span>
                  )}
                </div>
                {logoOverride && (
                  <button
                    type="button"
                    onClick={() => setLogoOverride(null)}
                    className="mt-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Non usare questo logo
                  </button>
                )}
                {currentLogoUrl && logoOverride !== currentLogoUrl && (
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Sovrascriverà il logo attuale.
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Colore brand rilevato
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorOverride ?? '#888888'}
                    onChange={(e) => setColorOverride(e.target.value.toUpperCase())}
                    className="h-10 w-12 cursor-pointer rounded-md border border-border bg-card p-1"
                  />
                  <input
                    type="text"
                    value={colorOverride ?? ''}
                    onChange={(e) => setColorOverride(e.target.value.toUpperCase() || null)}
                    placeholder="#E89B3C"
                    className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                {currentBrandColor && colorOverride !== currentBrandColor && colorOverride && (
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Sovrascriverà il colore attuale {currentBrandColor}.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Nome ufficiale & tono
              </p>
              <p className="text-sm text-foreground font-medium">{preview.analysis.official_name}</p>
              <p className="mt-1 text-xs text-muted-foreground italic">
                {preview.analysis.tone_description}
              </p>
              {preview.analysis.official_name !== tenantName && (
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  Sovrascriverà il nome attuale &quot;{tenantName}&quot;.
                </p>
              )}
            </div>

            {/* Catalog items */}
            {preview.catalogItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pagine catalogo trovate ({selectedItems.size} selezionate)
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedItems(
                        selectedItems.size === preview.catalogItems.length
                          ? new Set()
                          : new Set(preview.catalogItems.map((c) => c.url)),
                      )
                    }
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {selectedItems.size === preview.catalogItems.length
                      ? 'Deseleziona tutto'
                      : 'Seleziona tutto'}
                  </button>
                </div>
                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {preview.catalogItems.map((item) => {
                    const selected = selectedItems.has(item.url)
                    return (
                      <li key={item.url}>
                        <button
                          type="button"
                          onClick={() => toggleItem(item.url)}
                          className={`w-full text-left flex items-start gap-2.5 rounded-md border p-2.5 transition-colors ${
                            selected
                              ? 'border-primary/40 bg-card'
                              : 'border-border bg-muted/30 opacity-60'
                          }`}
                        >
                          <span
                            className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                              selected ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">
                              {item.title ?? item.url}
                            </span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {item.url}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/20">
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Annulla
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Applica importazione
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
