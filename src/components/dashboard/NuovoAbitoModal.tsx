'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Search, UserPlus, ChevronRight } from 'lucide-react'
import { createClientQuietAction } from '@/lib/actions/clients'
import { createGarmentAction } from '@/lib/actions/garments'
import { tokenize, matchesAllTokens } from '@/lib/search'

interface ClientOption {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
}

interface Props {
  clients: ClientOption[]
}

type Mode = 'search' | 'new'

export function NuovoAbitoModal({ clients }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const firstNameRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setOpen(false)
    setQuery('')
    setMode('search')
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'search') {
      setTimeout(() => searchRef.current?.focus(), 10)
    } else {
      setTimeout(() => firstNameRef.current?.focus(), 10)
    }
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const tokens = tokenize(query)
  const filtered = tokens.length
    ? clients.filter((c) =>
        matchesAllTokens(tokens, () => [c.first_name, c.last_name, c.email, c.phone]),
      )
    : clients.slice(0, 8)

  function gotoConfiguratore(clientId: string, garmentId: string) {
    router.push(
      `/dashboard/clienti/${clientId}/abiti/${garmentId}?from=produzione`,
    )
  }

  async function handleSelectClient(clientId: string) {
    setError(null)
    startTransition(async () => {
      const res = await createGarmentAction(clientId)
      if (!res.success) { setError(res.error); return }
      setOpen(false)
      gotoConfiguratore(clientId, res.data.id)
    })
  }

  function handleNewClientSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const first_name = (fd.get('first_name') as string).trim()
    const last_name = (fd.get('last_name') as string).trim()
    const phone = (fd.get('phone') as string).trim()
    setError(null)

    startTransition(async () => {
      const clientRes = await createClientQuietAction(
        first_name,
        last_name,
        phone || undefined,
      )
      if (!clientRes.success) { setError(clientRes.error); return }
      const clientId = clientRes.data.id

      const garmentRes = await createGarmentAction(clientId)
      if (!garmentRes.success) { setError(garmentRes.error); return }

      setOpen(false)
      gotoConfiguratore(clientId, garmentRes.data.id)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97] will-change-transform"
      >
        <Plus className="h-4 w-4" />
        Nuovo ordine
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" />

          <div
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 8rem)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-2xl text-ink leading-none">Nuovo ordine</h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Misure e configurazione li imposti nel funnel.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pt-5">
                <div className="flex gap-0.5 rounded-full bg-muted p-0.5 w-fit">
                  <button
                    onClick={() => setMode('search')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                      mode === 'search' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Search className="h-3 w-3" />
                    Cliente esistente
                  </button>
                  <button
                    onClick={() => setMode('new')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                      mode === 'new' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserPlus className="h-3 w-3" />
                    Nuovo cliente
                  </button>
                </div>
              </div>

              <div className="px-6 py-5">
                {mode === 'search' ? (
                  <div className="space-y-3">
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Nome, cognome, telefono o email…"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                    />
                    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden max-h-64 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <li className="px-4 py-6 text-center text-xs text-muted-foreground/60">
                          Nessun cliente trovato
                        </li>
                      ) : (
                        filtered.map((c) => (
                          <li key={c.id}>
                            <button
                              onClick={() => handleSelectClient(c.id)}
                              disabled={isPending}
                              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                            >
                              {c.first_name} {c.last_name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    {isPending && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Creazione abito…
                      </div>
                    )}
                  </div>
                ) : (
                  <form id="client-form" onSubmit={handleNewClientSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          Nome *
                        </label>
                        <input
                          ref={firstNameRef}
                          name="first_name"
                          required
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          Cognome *
                        </label>
                        <input
                          name="last_name"
                          required
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
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
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                      />
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border">
              {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

              {mode === 'new' && (
                <button
                  type="submit"
                  form="client-form"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97] will-change-transform"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Crea cliente e configura abito
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
