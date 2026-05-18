'use client'

import { useEffect, useState, useTransition } from 'react'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
  AlertTriangle,
  Power,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/settings/SettingsCard'
import {
  disconnectWhatsAppAction,
  sendTestMessageAction,
} from '@/lib/actions/whatsapp-integration'

interface IntegrationLite {
  id: string
  status: 'pending' | 'connected' | 'error' | 'revoked'
  display_phone_number: string | null
  verified_name: string | null
  last_error: string | null
  connected_at: string | null
}

interface Props {
  integration: IntegrationLite | null
  metaAppId: string
  configId: string
  isAdmin: boolean
}

interface FbAuthResponse {
  code?: string
  accessToken?: string
}
interface FbLoginResponse {
  status: string
  authResponse?: FbAuthResponse
}
interface FbSdk {
  init(opts: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }): void
  login(
    cb: (res: FbLoginResponse) => void,
    opts: Record<string, unknown>,
  ): void
}
declare global {
  interface Window {
    FB?: FbSdk
    fbAsyncInit?: () => void
  }
}

export function WhatsAppConnectCard({
  integration,
  metaAppId,
  configId,
  isAdmin,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sdkReady, setSdkReady] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Toast da query param (callback OAuth)
  useEffect(() => {
    const status = searchParams.get('status')
    if (!status) return
    if (status === 'ok') {
      const phone = searchParams.get('phone')
      toast.success(
        phone ? `WhatsApp connesso (${phone})` : 'WhatsApp connesso',
      )
    } else if (status === 'error') {
      const reason = searchParams.get('reason') ?? 'unknown'
      const detail = searchParams.get('detail') ?? ''
      toast.error(
        detail ? `Errore: ${reason} — ${detail}` : `Errore: ${reason}`,
      )
    }
    // Pulisce i query param
    const url = new URL(window.location.href)
    url.searchParams.delete('status')
    url.searchParams.delete('phone')
    url.searchParams.delete('reason')
    url.searchParams.delete('detail')
    window.history.replaceState(null, '', url.toString())
  }, [searchParams])

  const status = integration?.status ?? null
  const isConnected = status === 'connected'
  const isError = status === 'error'
  const isDisconnected = !integration || status === 'revoked'

  function startConnect() {
    if (!metaAppId || !configId) {
      toast.error('Configurazione Meta mancante (contatta il supporto)')
      return
    }
    if (!window.FB) {
      toast.error('SDK Facebook non ancora pronto, riprova tra un attimo')
      return
    }
    setConnecting(true)
    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          const target = `/api/auth/whatsapp/callback?code=${encodeURIComponent(
            response.authResponse.code,
          )}`
          window.location.href = target
        } else {
          setConnecting(false)
          toast.error('Login Facebook annullato')
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { version: 'v3' },
      },
    )
  }

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.FB && metaAppId) {
            window.FB.init({
              appId: metaAppId,
              version: 'v19.0',
              cookie: true,
              xfbml: false,
            })
            setSdkReady(true)
          }
        }}
      />

      <Card>
        <CardHeader
          label="WhatsApp Business"
          description="Ricevi messaggi e foto dai clienti direttamente in filo."
          action={
            <StatusBadge
              status={status}
              connected={isConnected}
              error={isError}
            />
          }
        />

        <div className="space-y-5 p-6">
          {isDisconnected && (
            <DisconnectedState
              onConnect={startConnect}
              connecting={connecting}
              sdkReady={sdkReady}
              configMissing={!metaAppId || !configId}
              disabled={!isAdmin}
            />
          )}

          {status === 'pending' && (
            <PendingState />
          )}

          {isConnected && integration && (
            <ConnectedState
              integration={integration}
              onChange={() => router.refresh()}
              canManage={isAdmin}
            />
          )}

          {isError && integration && (
            <ErrorState
              integration={integration}
              onRetry={startConnect}
              connecting={connecting}
              sdkReady={sdkReady}
              canManage={isAdmin}
            />
          )}
        </div>
      </Card>
    </>
  )
}

function StatusBadge({
  status,
  connected,
  error,
}: {
  status: string | null
  connected: boolean
  error: boolean
}) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" /> Connesso
      </span>
    )
  }
  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="h-3 w-3" /> Errore
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        In attesa
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Non connesso
    </span>
  )
}

function DisconnectedState({
  onConnect,
  connecting,
  sdkReady,
  configMissing,
  disabled,
}: {
  onConnect: () => void
  connecting: boolean
  sdkReady: boolean
  configMissing: boolean
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Collega il tuo WhatsApp Business per ricevere messaggi e foto dai
            clienti direttamente in filo. I clienti continueranno a scriverti sul
            numero che già usi.
          </p>
        </div>
      </div>

      <ul className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">
        <li>• Devi avere un account Meta Business Manager</li>
        <li>• Un numero di telefono dedicato a WhatsApp Business (non già su WhatsApp personale)</li>
        <li>• Procedura guidata di ~2 minuti</li>
      </ul>

      {configMissing && (
        <p className="text-xs text-destructive">
          Configurazione Meta non disponibile. Imposta META_APP_ID e
          EMBEDDED_SIGNUP_CONFIG_ID.
        </p>
      )}

      <button
        type="button"
        onClick={onConnect}
        disabled={disabled || configMissing || connecting || !sdkReady}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
      >
        {connecting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" />
        )}
        Connetti WhatsApp Business
      </button>
      {!sdkReady && !configMissing && (
        <p className="text-[11px] text-muted-foreground">
          Caricamento SDK Facebook…
        </p>
      )}
    </div>
  )
}

function PendingState() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Stiamo finalizzando la connessione…
    </div>
  )
}

function ConnectedState({
  integration,
  onChange,
  canManage,
}: {
  integration: IntegrationLite
  onChange: () => void
  canManage: boolean
}) {
  const [disconnectPending, startDisconnect] = useTransition()
  const [testPending, startTest] = useTransition()
  const [testTo, setTestTo] = useState(integration.display_phone_number ?? '')

  function handleDisconnect() {
    if (!confirm('Sicuro di voler disconnettere WhatsApp da filo?')) return
    startDisconnect(async () => {
      const res = await disconnectWhatsAppAction()
      if (res.success) {
        toast.success('Integrazione disconnessa')
        onChange()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleSendTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTest(async () => {
      const res = await sendTestMessageAction(fd)
      if (res.success) {
        toast.success('Messaggio di test inviato')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Numero
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {integration.display_phone_number ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Nome verificato
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {integration.verified_name ?? '—'}
          </dd>
        </div>
        {integration.connected_at && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Connesso il
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(integration.connected_at).toLocaleString('it-IT')}
            </dd>
          </div>
        )}
      </dl>

      {canManage && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Test della connessione
          </p>
          <form
            onSubmit={handleSendTest}
            className="mt-3 flex flex-wrap items-center gap-2 sm:flex-nowrap"
          >
            <input
              name="to"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="+39 333 1234567"
              required
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              disabled={testPending}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {testPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Invia test
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Solo numeri WhatsApp Business approvati riceveranno il messaggio
            (regole Meta sulle sessioni 24h).
          </p>
        </div>
      )}

      {canManage && (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnectPending}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          {disconnectPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}
          Disconnetti
        </button>
      )}
    </div>
  )
}

function ErrorState({
  integration,
  onRetry,
  connecting,
  sdkReady,
  canManage,
}: {
  integration: IntegrationLite
  onRetry: () => void
  connecting: boolean
  sdkReady: boolean
  canManage: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <p className="font-medium">Connessione interrotta</p>
        {integration.last_error && (
          <p className="mt-1 text-xs">{integration.last_error}</p>
        )}
      </div>
      {canManage && (
        <button
          type="button"
          onClick={onRetry}
          disabled={connecting || !sdkReady}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {connecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Riprova
        </button>
      )}
    </div>
  )
}
