'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClientAction } from '@/lib/actions/clients'

interface NuovoClienteContextValue {
  open: () => void
  close: () => void
  isOpen: boolean
}

const NuovoClienteContext = createContext<NuovoClienteContextValue | null>(null)

/**
 * Ritorna il controllo della modale. Se il provider non è montato (es. /platform),
 * ritorna stub no-op così è safe-by-default chiamarlo ovunque.
 */
export function useNuovoCliente(): NuovoClienteContextValue {
  const ctx = useContext(NuovoClienteContext)
  return ctx ?? { open: () => {}, close: () => {}, isOpen: false }
}

export function NuovoClienteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <NuovoClienteContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && <NuovoClienteModal onClose={close} />}
    </NuovoClienteContext.Provider>
  )
}

function NuovoClienteModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const firstNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => firstNameRef.current?.focus(), 10)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      try {
        const res = await createClientAction(fd)
        // createClientAction esegue redirect() su success — se torna qui è errore.
        if (res && !res.success) {
          setError(res.error)
          toast.error('Impossibile creare il cliente', { description: res.error })
        }
      } catch (e) {
        // Next.js redirect throw — lo lasciamo propagare alla navigation
        if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
        const digest = (e as { digest?: string })?.digest
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw e
        setError(e instanceof Error ? e.message : 'Errore sconosciuto')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-xl text-ink leading-none">Nuovo cliente</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo i dati essenziali. Completi la scheda dopo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Nome *
                </label>
                <input
                  ref={firstNameRef}
                  name="first_name"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Cognome *
                </label>
                <input
                  name="last_name"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Telefono
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+39 …"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="cliente@esempio.it"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="newsletter_email_opt_in"
                value="on"
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <div>
                <p className="text-sm text-foreground">
                  Acconsente a ricevere comunicazioni email
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Newsletter occasionali su nuovi tessuti, eventi, novità di atelier.
                </p>
              </div>
            </label>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Crea cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
