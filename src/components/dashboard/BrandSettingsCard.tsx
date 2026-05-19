'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import { updateMyBrandingAction } from '@/lib/actions/tenants'

interface Props {
  tenantName: string
  currentLogoUrl: string | null
  currentBrandColor: string | null
}

const DEFAULT_COLOR = '#E89B3C'

export function BrandSettingsCard({ tenantName, currentLogoUrl, currentBrandColor }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [brandColor, setBrandColor] = useState(currentBrandColor ?? DEFAULT_COLOR)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setRemoveLogo(false)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleRemove() {
    setLogoPreview(null)
    setPendingFile(null)
    setRemoveLogo(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    if (pendingFile) formData.set('logo', pendingFile)
    if (removeLogo) formData.set('remove_logo', '1')
    formData.set('brand_color', brandColor)

    startTransition(async () => {
      const res = await updateMyBrandingAction(formData)
      if (res.success) {
        toast.success('Brand sartoria aggiornato')
        setPendingFile(null)
        setRemoveLogo(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  const hasChanges =
    pendingFile !== null ||
    removeLogo ||
    brandColor.toUpperCase() !== (currentBrandColor ?? DEFAULT_COLOR).toUpperCase()

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="border-b border-border px-6 pt-5 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Brand sartoria
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Logo e colore usati nelle email, nelle newsletter e nel portale clienti.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Logo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Logo
            </label>
            <p className="mt-1 text-xs text-muted-foreground/70">
              PNG, JPG, WebP o SVG. Max 1 MB. Sfondo trasparente consigliato.
            </p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-2 overflow-hidden">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt={tenantName}
                    width={150}
                    height={60}
                    className="max-h-16 max-w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="font-heading text-xs text-muted-foreground">
                    Nessun logo
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {logoPreview ? 'Cambia' : 'Carica logo'}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Rimuovi
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Brand color */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Colore brand
            </label>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Accent per email, bottoni e bordi nelle comunicazioni.
            </p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-card p-1"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
                placeholder="#E89B3C"
                className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring/30"
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Anteprima
            </label>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Mockup intestazione email.
            </p>
          </div>
          <div className="md:col-span-2">
            <div
              className="rounded-lg border border-border overflow-hidden bg-white"
              style={{ borderTopColor: brandColor, borderTopWidth: '3px' }}
            >
              <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-border/60">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt={tenantName}
                    style={{ maxHeight: 32, maxWidth: 160 }}
                  />
                ) : (
                  <span className="font-heading text-base text-foreground">
                    {tenantName}
                  </span>
                )}
              </div>
              <div className="px-5 py-5 space-y-2 text-sm text-foreground">
                <p>Caro Marco,</p>
                <p className="text-muted-foreground">
                  questa è un'anteprima di come apparirà il logo e il colore della sartoria
                  nelle newsletter inviate ai tuoi clienti.
                </p>
                <div>
                  <span
                    className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Scopri il tessuto
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
        <button
          type="submit"
          disabled={!hasChanges || isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Salva modifiche
        </button>
      </div>
    </form>
  )
}
