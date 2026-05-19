'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2, Send, Sparkles, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  previewAnnouncementAction,
  sendAnnouncementAction,
} from '@/lib/actions/fabric-announcement'

// Costo medio: WhatsApp marketing IT ≈ €0.06 / conversazione (Meta pricing 2025).
const COST_PER_MESSAGE_EUR = 0.06

interface FabricLite {
  id: string
  name: string
  mill: string | null
  composition: string | null
  color: string | null
  pattern: string | null
  weight_grams: number | null
  season: string | null
  image_url: string | null
  price_per_meter: number | null
}

export interface AnnouncementItem {
  announcementId: string
  clientId: string
  clientName: string
  clientPhone: string | null
  optedOut: boolean
  status: 'pending_review' | 'approved' | 'sent' | 'failed' | 'skipped'
  matchScore: number
  matchReason: string
  messageBody: string
  sentAt: string | null
  error: string | null
}

interface Props {
  fabric: FabricLite
  items: AnnouncementItem[]
  blockers: string[]
  cap: { monthlyCap: number; currentMonthSent: number }
}

export function AnnouncementPreview({ fabric, items, blockers, cap }: Props) {
  const [pendingPreview, startPreview] = useTransition()
  const [pendingSend, startSend] = useTransition()
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<{
    sent: number
    failed: number
    errors: Array<{ clientId: string; error: string }>
  } | null>(null)

  // Mappa locale: clientId → { selected, message } per consentire edit + (de)selezione
  const candidates = items.filter((i) => i.status !== 'sent' && !i.optedOut)
  const sentItems = items.filter((i) => i.status === 'sent')

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(candidates.map((c) => [c.clientId, c.status !== 'failed'])),
  )
  const [messages, setMessages] = useState<Record<string, string>>(() =>
    Object.fromEntries(candidates.map((c) => [c.clientId, c.messageBody])),
  )

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  )

  const remainingCap = Math.max(0, cap.monthlyCap - cap.currentMonthSent)
  const estimatedCost = (selectedCount * COST_PER_MESSAGE_EUR).toFixed(2)

  const canSend =
    blockers.length === 0 &&
    selectedCount > 0 &&
    selectedCount <= remainingCap &&
    !pendingSend

  function handleGeneratePreview() {
    setPreviewError(null)
    setSendResult(null)
    startPreview(async () => {
      const fd = new FormData()
      fd.set('fabricId', fabric.id)
      const res = await previewAnnouncementAction(fd)
      if (!res.success) setPreviewError(res.error)
    })
  }

  function handleSend() {
    setSendError(null)
    setSendResult(null)

    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k)

    if (ids.length === 0) {
      setSendError('Seleziona almeno un cliente.')
      return
    }
    if (ids.length > 5) {
      const ok = confirm(
        `Confermi l'invio a ${ids.length} clienti? Ogni messaggio costa circa €${COST_PER_MESSAGE_EUR.toFixed(
          2,
        )}.`,
      )
      if (!ok) return
    }
    const ok2 = confirm(
      `Stai per inviare ${ids.length} messaggi WhatsApp marketing. Procedere?`,
    )
    if (!ok2) return

    startSend(async () => {
      const fd = new FormData()
      fd.set('fabricId', fabric.id)
      fd.set('clientIds', JSON.stringify(ids))
      for (const id of ids) {
        fd.set(`message_${id}`, messages[id] ?? '')
      }
      const res = await sendAnnouncementAction(fd)
      if (!res.success) setSendError(res.error)
      else if (res.data) setSendResult(res.data)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ── Colonna sinistra: scheda tessuto ──────────────────── */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {fabric.image_url ? (
            <div className="relative aspect-square bg-muted/30">
              <Image
                src={fabric.image_url}
                alt={fabric.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-muted/30 text-xs text-muted-foreground">
              Nessuna foto
            </div>
          )}
          <div className="space-y-2.5 px-5 py-4 text-sm">
            <div className="font-medium text-foreground">{fabric.name}</div>
            <dl className="space-y-1 text-xs">
              {fabric.mill && <Row label="Brand" value={fabric.mill} />}
              {fabric.composition && <Row label="Composizione" value={fabric.composition} />}
              {fabric.weight_grams && <Row label="Peso" value={`${fabric.weight_grams} g/m²`} />}
              {fabric.color && <Row label="Colore" value={fabric.color} />}
              {fabric.pattern && <Row label="Pattern" value={fabric.pattern} />}
              {fabric.season && <Row label="Stagione" value={fabric.season} />}
              {fabric.price_per_meter && (
                <Row label="Prezzo/m" value={`€${fabric.price_per_meter}`} />
              )}
            </dl>
          </div>
        </div>

        {/* Cap mensile */}
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Cap mensile
          </p>
          <p className="font-heading mt-2 text-3xl leading-none tabular-nums text-ink">
            {cap.currentMonthSent}/{cap.monthlyCap}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Restano {remainingCap} invii questo mese.
          </p>
        </div>
      </aside>

      {/* ── Colonna destra: candidati + invio ───────────────────── */}
      <section className="lg:col-span-2 space-y-4">
        {blockers.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 px-5 py-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Configurazione incompleta
            </div>
            <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-0.5">
              {blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}

        {/* Header generate preview */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Match AI
            </p>
            <p className="mt-1 text-sm text-foreground">
              {items.length === 0
                ? 'Nessuna preview generata.'
                : `${candidates.length} candidati · ${sentItems.length} già inviati`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGeneratePreview}
            disabled={pendingPreview || blockers.includes('Il tessuto non ha foto: aggiungi image_url prima di annunciarlo.')}
          >
            {pendingPreview ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {items.length === 0 ? 'Genera preview' : 'Rigenera preview'}
          </Button>
        </div>

        {previewError && <Alert kind="error" message={previewError} />}

        {/* Candidati */}
        {candidates.length === 0 && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nessuna preview ancora. Clicca su <strong>Genera preview</strong> per individuare i clienti potenzialmente interessati.
            </p>
          </div>
        )}

        {candidates.length === 0 && items.length > 0 && sentItems.length > 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Tutti i match sono già stati inviati o annullati.
            </p>
          </div>
        )}

        {candidates.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <ul className="divide-y divide-border">
              {candidates.map((c) => (
                <li key={c.clientId} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                      <Checkbox
                        checked={!!selected[c.clientId]}
                        onCheckedChange={(v) =>
                          setSelected((prev) => ({ ...prev, [c.clientId]: !!v }))
                        }
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {c.clientName}
                          </span>
                          <ScoreBadge score={c.matchScore} />
                          {c.status === 'failed' && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
                              Ultimo invio fallito
                            </span>
                          )}
                          {!c.clientPhone && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              No telefono
                            </span>
                          )}
                        </div>
                        {c.matchReason && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {c.matchReason}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>

                  <Textarea
                    value={messages[c.clientId] ?? ''}
                    onChange={(e) =>
                      setMessages((prev) => ({
                        ...prev,
                        [c.clientId]: e.target.value,
                      }))
                    }
                    rows={3}
                    className="text-sm"
                    placeholder="Testo del messaggio…"
                  />
                  {c.error && (
                    <p className="text-xs text-destructive font-mono">{c.error}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risultato invio */}
        {sendResult && (
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Invio completato: <span className="tabular-nums">{sendResult.sent}</span>{' '}
              inviati, <span className="tabular-nums">{sendResult.failed}</span> falliti
            </div>
            {sendResult.errors.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {sendResult.errors.map((e, i) => (
                  <li key={i} className="font-mono">
                    {e.clientId.slice(0, 8)}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {sendError && <Alert kind="error" message={sendError} />}

        {/* Footer: invia */}
        {candidates.length > 0 && (
          <div className="sticky bottom-4 rounded-xl border border-border bg-card px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground tabular-nums">{selectedCount}</strong>{' '}
              {selectedCount === 1 ? 'cliente selezionato' : 'clienti selezionati'} · stima costo{' '}
              <strong className="text-foreground tabular-nums">€{estimatedCost}</strong>
            </div>
            <Button type="button" onClick={handleSend} disabled={!canSend}>
              {pendingSend ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Invia a {selectedCount}
            </Button>
          </div>
        )}

        {/* Storico inviati */}
        {sentItems.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Già inviati
              </p>
            </div>
            <ul className="divide-y divide-border">
              {sentItems.map((c) => (
                <li
                  key={c.clientId}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{c.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.sentAt ? new Date(c.sentAt).toLocaleString('it-IT') : '—'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-right truncate">{value}</dd>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  let cls = 'bg-muted text-muted-foreground'
  if (score >= 86) cls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  else if (score >= 70) cls = 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
  else if (score >= 50) cls = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wide tabular-nums ${cls}`}
    >
      {score}/100
    </span>
  )
}

function Alert({ kind, message }: { kind: 'error' | 'info'; message: string }) {
  const cls =
    kind === 'error'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-border bg-muted/30 text-foreground'
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  )
}
