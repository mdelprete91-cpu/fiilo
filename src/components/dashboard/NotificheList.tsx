'use client'

import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { isToday, isYesterday, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { markAllAsRead } from '@/lib/actions/whatsapp'
import { WhatsAppMessageCard } from './WhatsAppMessageCard'
import type { WhatsappCategory, WhatsappMessage } from '@/types/database'
import type { WhatsappMessageWithClient } from '@/lib/actions/whatsapp'

type FilterValue = WhatsappCategory | 'all'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',                   label: 'Tutte'       },
  { value: 'misura',                label: 'Misure'      },
  { value: 'ispirazione',           label: 'Ispirazione' },
  { value: 'riferimento_dettaglio', label: 'Dettagli'    },
  { value: 'richiesta',             label: 'Richieste'   },
  { value: 'approvazione',          label: 'Conferme'    },
]

interface Props {
  messages: WhatsappMessageWithClient[]
  unreadCount: number
  tenantId: string
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Oggi'
  if (isYesterday(date)) return 'Ieri'
  return format(date, 'd MMMM', { locale: it })
}

function groupByDay(items: WhatsappMessageWithClient[]) {
  const groups: { label: string; items: WhatsappMessageWithClient[] }[] = []
  for (const msg of items) {
    const label = dayLabel(new Date(msg.sent_at))
    const last = groups[groups.length - 1]
    if (last?.label === label) {
      last.items.push(msg)
    } else {
      groups.push({ label, items: [msg] })
    }
  }
  return groups
}

export function NotificheList({ messages: initial, unreadCount: initialCount, tenantId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<WhatsappMessageWithClient[]>(initial)
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`whatsapp_messages:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const raw = payload.new as WhatsappMessage
          const newMsg: WhatsappMessageWithClient = {
            ...raw,
            client_first_name: null,
            client_last_name: null,
          }
          setMessages((prev) => [newMsg, ...prev])
          if (!raw.is_read) setUnreadCount((n) => n + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  const filtered = activeFilter === 'all'
    ? messages
    : messages.filter((m) => m.category === activeFilter)

  const groups = groupByDay(filtered)

  const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f.value] = f.value === 'all'
      ? messages.length
      : messages.filter((m) => m.category === f.value).length
    return acc
  }, {})

  async function handleMarkAll() {
    setLoading(true)
    await markAllAsRead()
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })))
    setUnreadCount(0)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Messaggi WhatsApp</h2>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
              style={{ background: 'oklch(0.50 0.18 250)', color: '#fff' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Segna tutte come lette
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map((f) => {
          const count = counts[f.value] ?? 0
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="text-xs px-3 py-1.5 rounded-sm font-medium transition-colors flex items-center gap-1.5"
              style={
                activeFilter === f.value
                  ? { background: 'var(--color-ink)', color: 'var(--background)' }
                  : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
              }
            >
              {f.label}
              {f.value !== 'all' && count > 0 && (
                <span className="tabular-nums opacity-60 text-[11px]">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="rounded-sm border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Nessun messaggio</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {activeFilter === 'all'
                ? 'I messaggi WhatsApp dei tuoi clienti appariranno qui non appena il webhook sarà attivo.'
                : 'Nessun messaggio in questa categoria.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {groups.map((group) => (
              <Fragment key={group.label}>
                <li className="px-5 py-2 bg-muted/30 border-b border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                </li>
                {group.items.map((msg) => (
                  <li key={msg.id}>
                    <WhatsAppMessageCard message={msg} />
                  </li>
                ))}
              </Fragment>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
