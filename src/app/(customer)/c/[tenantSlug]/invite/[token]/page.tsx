import { redirect } from 'next/navigation'
import { consumeCustomerInvite } from '@/lib/actions/customer-invites'

interface PageProps {
  params: Promise<{ tenantSlug: string; token: string }>
}

export default async function CustomerInvitePage({ params }: PageProps) {
  const { tenantSlug, token } = await params

  const result = await consumeCustomerInvite(token)

  if (!result.success) {
    redirect(`/c/${tenantSlug}/login?error=${encodeURIComponent(result.error)}`)
  }

  // Redirige direttamente al magic link generato da Supabase, che a sua
  // volta passerà per /auth/callback e creerà la sessione cookie.
  redirect(result.magicLink)
}
