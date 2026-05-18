'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Heart,
  Image as ImageIcon,
  RefreshCw,
  Ruler,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { regenerateSummary } from '@/lib/actions/client-summary'
import type { ClientSummaryJson, ClientSummaryRow } from '@/lib/ai/client-summary'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Props {
  summary: ClientSummaryRow | null
  clientId: string
  unreadMessagesCount: number
}

export function ClientSummaryCard({ summary, clientId, unreadMessagesCount }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('clientId', clientId)
      const result = await regenerateSummary(fd)
      if (!result.success) setError(result.error)
    })
  }

  if (isPending) return <SummarySkeleton />

  if (!summary) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <CardHeader title="Sintesi AI" />
        <div className="flex flex-col items-start gap-3 px-5 py-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm text-muted-foreground">
              Nessuna sintesi disponibile. Genera per riassumere i messaggi WhatsApp di questo cliente.
            </div>
          </div>
          {error && <ErrorBanner message={error} />}
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-colors hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Genera sintesi
          </button>
        </div>
      </div>
    )
  }

  const json = summary.summary_json as ClientSummaryJson
  const generatedAgo = formatDistanceToNow(new Date(summary.generated_at), {
    addSuffix: true,
    locale: it,
  })

  return (
    <div className="rounded-xl border border-border bg-card">
      <CardHeader title="Sintesi AI">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            Aggiornata {generatedAgo} · {summary.source_message_count} messaggi
          </span>
          {unreadMessagesCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {unreadMessagesCount} nuovi
            </span>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={unreadMessagesCount === 0 && !error}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium transition-colors',
              unreadMessagesCount === 0
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-muted',
            )}
            title={
              unreadMessagesCount === 0
                ? 'Nessun messaggio nuovo da analizzare'
                : 'Aggiorna sintesi'
            }
          >
            <RefreshCw className="h-3 w-3" />
            Aggiorna
          </button>
        </div>
      </CardHeader>

      {json.highlights && (
        <div className="border-b border-border bg-muted/30 px-5 py-3 text-sm leading-relaxed text-foreground">
          {json.highlights}
        </div>
      )}

      <div className="space-y-4 px-5 py-4 text-sm">
        {error && <ErrorBanner message={error} />}

        <Section
          icon={<Heart className="h-3.5 w-3.5" />}
          title="Preferenze"
          empty={json.preferences.length === 0}
        >
          {json.preferences.map((p, i) => (
            <Bullet key={i} messageId={p.message_id ?? null}>
              {p.text}
            </Bullet>
          ))}
        </Section>

        <Section
          icon={<Ruler className="h-3.5 w-3.5" />}
          title="Misure menzionate"
          empty={json.pending_measurements.length === 0}
          footer={
            json.pending_measurements.length > 0 ? (
              <Link
                href={`/dashboard/clienti/${clientId}/misure/nuova`}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Apri scheda misure →
              </Link>
            ) : null
          }
        >
          {json.pending_measurements.map((m, i) => (
            <Bullet key={i} messageId={m.message_id ?? null}>
              <span className="font-medium text-foreground">{m.label}:</span>{' '}
              <span className="tabular-nums">{m.value}</span>
            </Bullet>
          ))}
        </Section>

        <Section
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          title="Reference visivi"
          empty={json.visual_references.length === 0}
        >
          {json.visual_references.map((v, i) => (
            <Bullet key={i} messageId={v.message_id ?? null}>
              {v.description}
            </Bullet>
          ))}
        </Section>

        <Section
          icon={<Calendar className="h-3.5 w-3.5" />}
          title="Eventi e scadenze"
          empty={json.events.length === 0}
        >
          {json.events.map((e, i) => (
            <Bullet key={i} messageId={e.message_id ?? null}>
              <span className="font-medium text-foreground">{e.label}</span>
              {e.date ? <span className="text-muted-foreground"> · {e.date}</span> : null}
            </Bullet>
          ))}
        </Section>

        {json.relationship_status && (
          <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide text-[10px] text-foreground/70">
              Stato relazione ·{' '}
            </span>
            {json.relationship_status}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-2.5 text-[10px] text-muted-foreground">
        Generato da AI · verifica con il cliente prima di prendere decisioni.
      </div>
    </div>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function CardHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
      <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function Section({
  icon,
  title,
  children,
  empty,
  footer,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  empty: boolean
  footer?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {title}
      </div>
      {empty ? (
        <p className="text-xs italic text-muted-foreground/70">Nessun elemento rilevato.</p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
      {footer && <div className="mt-1.5">{footer}</div>}
    </div>
  )
}

function Bullet({
  children,
  messageId,
}: {
  children: React.ReactNode
  messageId: string | null
}) {
  return (
    <li className="flex items-start gap-2 text-sm leading-snug text-foreground/90">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/50" aria-hidden />
      <span className="flex-1">{children}</span>
      {messageId && (
        <a
          href={`#msg-${messageId}`}
          className="shrink-0 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
          title="Vai al messaggio"
        >
          ↗ msg
        </a>
      )}
    </li>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <CardHeader title="Sintesi AI" />
      <div className="space-y-4 px-5 py-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    </div>
  )
}
