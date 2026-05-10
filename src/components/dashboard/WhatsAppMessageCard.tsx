'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { markAsRead } from '@/lib/actions/whatsapp'
import type { WhatsappCategory, WhatsappMessage } from '@/types/database'

interface Props {
  message: WhatsappMessage & {
    client_first_name?: string | null
    client_last_name?: string | null
  }
  clientId?: string
}

const CATEGORY_LABELS: Record<WhatsappCategory, string> = {
  misura: 'Misure',
  ispirazione: 'Ispirazione',
  riferimento_dettaglio: 'Dettaglio',
  richiesta: 'Richiesta',
  approvazione: 'Approvazione',
  altro: 'Messaggio',
}

const CATEGORY_STYLE: Record<WhatsappCategory, React.CSSProperties> = {
  misura:               { background: 'oklch(0.93 0.04 250)', color: 'oklch(0.35 0.07 250)' },
  ispirazione:          { background: 'oklch(0.93 0.05 155)', color: 'oklch(0.28 0.07 155)' },
  riferimento_dettaglio:{ background: 'oklch(0.96 0.06 70)',  color: 'oklch(0.50 0.12 55)'  },
  richiesta:            { background: 'oklch(0.95 0.04 25)',  color: 'oklch(0.45 0.12 25)'  },
  approvazione:         { background: 'oklch(0.93 0.05 155)', color: 'oklch(0.28 0.09 140)' },
  altro:                { background: 'oklch(0.94 0.005 85)', color: 'oklch(0.55 0.02 85)'  },
}

const AVATAR_PALETTES = [
  { bg: 'oklch(0.87 0.07 250)', text: 'oklch(0.28 0.12 250)' },
  { bg: 'oklch(0.87 0.06 155)', text: 'oklch(0.23 0.10 155)' },
  { bg: 'oklch(0.90 0.08 25)',  text: 'oklch(0.35 0.15 25)'  },
  { bg: 'oklch(0.87 0.07 290)', text: 'oklch(0.30 0.12 290)' },
  { bg: 'oklch(0.90 0.07 70)',  text: 'oklch(0.38 0.12 70)'  },
]

function avatarPalette(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) || 0) + ((h << 5) - h)
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length] ?? AVATAR_PALETTES[0]!
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}

export function WhatsAppMessageCard({ message, clientId }: Props) {
  const clientName = message.client_first_name
    ? `${message.client_first_name} ${message.client_last_name ?? ''}`.trim()
    : message.from_name ?? message.from_phone

  const waLink = `https://wa.me/${message.from_phone.replace(/\D/g, '')}`
  const timeAgo = formatDistanceToNow(new Date(message.sent_at), { addSuffix: true, locale: it })
  const palette = avatarPalette(clientName)
  const isUnread = !message.is_read

  async function handleRead() {
    if (isUnread) await markAsRead(message.id)
  }

  const nameEl = (message.client_first_name && !clientId) ? (
    <Link
      href={`/dashboard/clienti/${(message as { client_id?: string }).client_id}`}
      className={`text-sm leading-tight truncate hover:underline ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {clientName}
    </Link>
  ) : (
    <span className={`text-sm leading-tight truncate ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
      {clientName}
    </span>
  )

  return (
    <div
      className="flex gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-default"
      style={isUnread ? { background: 'oklch(0.988 0.006 250)' } : undefined}
      onClick={handleRead}
    >
      {/* Avatar with unread indicator */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold select-none"
          style={{ background: palette.bg, color: palette.text }}
        >
          {getInitials(clientName)}
        </div>
        {isUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
            style={{ background: 'oklch(0.50 0.18 250)' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + badge + time */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            {nameEl}
            <span
              className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide leading-none"
              style={CATEGORY_STYLE[message.category]}
            >
              {CATEGORY_LABELS[message.category]}
            </span>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
        </div>

        {/* Summary */}
        <p className="text-xs font-medium text-foreground/70 mt-0.5 leading-snug">
          {message.category_summary ?? CATEGORY_LABELS[message.category]}
        </p>

        {/* Body preview */}
        {message.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 leading-relaxed">
            {message.body}
          </p>
        )}

        {/* Footer */}
        <div className="mt-1.5 flex items-center justify-between">
          {message.media_url ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <PhotoIcon className="h-3 w-3" />
              Foto allegata
            </span>
          ) : <span />}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <WhatsAppIcon className="h-3 w-3" />
            Apri in WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.526 5.855L.057 23.632a.5.5 0 0 0 .614.612l5.907-1.465A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.387l-.36-.214-3.735.927.972-3.643-.234-.374A9.795 9.795 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  )
}
