import { StatusBannerClient } from './StatusBannerClient'

type StatusLevel = 'info' | 'warning' | 'success'

function isStatusLevel(value: string | undefined): value is StatusLevel {
  return value === 'info' || value === 'warning' || value === 'success'
}

/**
 * Banner sottile globale guidato da env vars su Vercel:
 *  - NEXT_PUBLIC_STATUS_MESSAGE: testo da mostrare (vuoto = nessun banner)
 *  - NEXT_PUBLIC_STATUS_LEVEL:   info | warning | success (default: info)
 *
 * Il dismiss è per sessione (localStorage).
 */
export function StatusBanner() {
  const message = process.env.NEXT_PUBLIC_STATUS_MESSAGE?.trim()
  if (!message) return null

  const rawLevel = process.env.NEXT_PUBLIC_STATUS_LEVEL?.trim()
  const level: StatusLevel = isStatusLevel(rawLevel) ? rawLevel : 'info'

  return <StatusBannerClient message={message} level={level} />
}
