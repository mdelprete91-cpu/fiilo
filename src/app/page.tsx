import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { LandingPage } from '@/components/marketing/LandingPage'
import { getSession } from '@/lib/auth/session'

type Locale = 'it' | 'en'

/**
 * Picks Italian if the browser's primary Accept-Language starts with `it`,
 * otherwise English. Server-side detection avoids a hydration flicker.
 */
async function detectLocale(): Promise<Locale> {
  const h = await headers()
  const accept = h.get('accept-language') ?? ''
  const first = accept.split(',')[0]?.trim().toLowerCase() ?? ''
  return first.startsWith('it') ? 'it' : 'en'
}

export default async function RootPage() {
  const session = await getSession()

  if (session) {
    if (session.role === 'platform_owner') redirect('/platform')
    redirect('/dashboard')
  }

  const locale = await detectLocale()
  return <LandingPage locale={locale} />
}
