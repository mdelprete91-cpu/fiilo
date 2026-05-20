'use client'

import { useEffect, useState } from 'react'
import { Info, AlertTriangle, CheckCircle2, X } from 'lucide-react'

type StatusLevel = 'info' | 'warning' | 'success'

interface Props {
  message: string
  level: StatusLevel
}

const STORAGE_KEY_PREFIX = 'fiilo:status-banner-dismissed:'

const STYLES: Record<StatusLevel, { bg: string; text: string; icon: typeof Info }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    text: 'text-blue-900 dark:text-blue-100',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    text: 'text-amber-900 dark:text-amber-100',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    text: 'text-emerald-900 dark:text-emerald-100',
    icon: CheckCircle2,
  },
}

export function StatusBannerClient({ message, level }: Props) {
  const storageKey = STORAGE_KEY_PREFIX + hash(message)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(storageKey) === '1'
      setDismissed(isDismissed)
    } catch {
      setDismissed(false)
    }
  }, [storageKey])

  if (dismissed) return null

  const { bg, text, icon: Icon } = STYLES[level]

  function handleDismiss() {
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      // sessionStorage può essere bloccato (Safari private mode); ignoriamo.
    }
    setDismissed(true)
  }

  return (
    <div
      role="status"
      className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-sm ${bg} ${text}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="leading-tight">{message}</span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Chiudi messaggio"
        className="rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// Hash deterministico semplice per generare una chiave stabile per messaggio.
// Quando Mario aggiorna il messaggio, la chiave cambia e il banner riappare.
function hash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}
