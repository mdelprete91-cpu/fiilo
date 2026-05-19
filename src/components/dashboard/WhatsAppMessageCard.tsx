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

const CATEGORY_CLASS: Record<WhatsappCategory, string> = {
  misura:
    'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  ispirazione:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  riferimento_dettaglio:
    'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  richiesta:
    'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  approvazione:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  altro: 'bg-secondary text-muted-foreground',
}

// Whisper può ritornare il nome esteso ("italian", "english") invece del codice ISO.
// Normalizziamo qui per la UI così possiamo nascondere il chip quando la lingua è
// l'italiano (default atteso).
const LANGUAGE_TO_ISO: Record<string, string> = {
  italian: 'it', italiano: 'it', it: 'it',
  english: 'en', en: 'en',
  spanish: 'es', español: 'es', spagnolo: 'es', es: 'es',
  french: 'fr', francese: 'fr', français: 'fr', fr: 'fr',
  german: 'de', deutsch: 'de', tedesco: 'de', de: 'de',
  portuguese: 'pt', português: 'pt', portoghese: 'pt', pt: 'pt',
  arabic: 'ar', arabo: 'ar', ar: 'ar',
  chinese: 'zh', cinese: 'zh', zh: 'zh',
}

function normalizeLanguage(lang: string | null | undefined): string | null {
  if (!lang) return null
  const l = lang.toLowerCase().trim()
  return LANGUAGE_TO_ISO[l] ?? l.slice(0, 2)
}

const AVATAR_CLASSES = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
]

function avatarClass(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) || 0) + ((h << 5) - h)
  return AVATAR_CLASSES[Math.abs(h) % AVATAR_CLASSES.length] ?? AVATAR_CLASSES[0]!
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
  const timeAgo = formatDistanceToNow(new Date(message.sent_at), {
    addSuffix: true,
    locale: it,
  })
  const avatarPalette = avatarClass(clientName)
  const isUnread = !message.is_read
  const detectedLangIso = normalizeLanguage(message.detected_language)
  const isTranscribedAudio = message.message_type === 'audio' && Boolean(message.body)
  const summaryText = isTranscribedAudio
    ? 'Trascrizione di messaggio vocale con AI'
    : message.category_summary ?? CATEGORY_LABELS[message.category]

  async function handleRead() {
    if (isUnread) await markAsRead(message.id)
  }

  const nameEl =
    message.client_first_name && !clientId ? (
      <Link
        href={`/dashboard/clienti/${(message as { client_id?: string }).client_id}`}
        className={`truncate text-sm leading-tight hover:underline ${
          isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {clientName}
      </Link>
    ) : (
      <span
        className={`truncate text-sm leading-tight ${
          isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
        }`}
      >
        {clientName}
      </span>
    )

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex cursor-default gap-3 scroll-mt-24 px-5 py-3.5 transition-colors hover:bg-muted/40 ${
        isUnread ? 'bg-blue-50/60 dark:bg-blue-950/15' : ''
      }`}
      onClick={handleRead}
    >
      {/* Avatar with unread indicator */}
      <div className="relative mt-0.5 shrink-0">
        <div
          className={`flex h-10 w-10 select-none items-center justify-center rounded-full text-sm font-bold ${avatarPalette}`}
        >
          {getInitials(clientName)}
        </div>
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-blue-500 dark:bg-blue-400" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + badge + time */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {nameEl}
            <span
              className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide ${CATEGORY_CLASS[message.category]}`}
            >
              {CATEGORY_LABELS[message.category]}
            </span>
            {detectedLangIso && detectedLangIso !== 'it' && (
              <span
                className="shrink-0 rounded-sm border border-border px-1 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide text-muted-foreground"
                title={`Lingua rilevata: ${message.detected_language}`}
              >
                {detectedLangIso}
              </span>
            )}
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
            {timeAgo}
          </span>
        </div>

        {/* Summary */}
        <p className="mt-0.5 truncate text-xs font-medium leading-snug text-foreground/70">
          {summaryText}
        </p>

        {/* Body preview */}
        {message.body && (
          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
            {message.body}
          </p>
        )}

        {/* Photo analysis tags (Llama Vision via Groq) */}
        {message.photo_analysis && (
          <PhotoTags analysis={message.photo_analysis} />
        )}

        {/* Footer */}
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {message.media_url && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <PhotoIcon className="h-3 w-3" />
                Foto allegata
              </span>
            )}
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
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

interface PhotoAnalysisShape {
  garment_type?: string | null
  pattern?: string | null
  colors?: string[] | null
  details?: string[] | null
}

function PhotoTags({
  analysis,
}: {
  analysis: NonNullable<WhatsappMessage['photo_analysis']>
}) {
  const a = analysis as unknown as PhotoAnalysisShape
  const tags = [
    a.garment_type,
    a.pattern,
    ...(a.colors ?? []).slice(0, 2),
    ...(a.details ?? []).slice(0, 2),
  ].filter((t): t is string => Boolean(t))

  if (tags.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {tags.slice(0, 5).map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/70 dark:bg-muted"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.526 5.855L.057 23.632a.5.5 0 0 0 .614.612l5.907-1.465A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.387l-.36-.214-3.735.927.972-3.643-.234-.374A9.795 9.795 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  )
}
