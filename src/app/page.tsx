import { redirect } from 'next/navigation'

import { LandingPage } from '@/components/marketing/LandingPage'
import { getSession } from '@/lib/auth/session'

export default async function RootPage() {
  const session = await getSession()

  if (session) {
    if (session.role === 'platform_owner') redirect('/platform')
    redirect('/dashboard')
  }

  return <LandingPage />
}
