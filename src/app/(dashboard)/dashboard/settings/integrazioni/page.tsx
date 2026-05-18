import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { TopBar } from '@/components/layout/TopBar'
import { getIntegrationByTenant } from '@/lib/whatsapp/integrations'
import { WhatsAppConnectCard } from '@/components/settings/WhatsAppConnectCard'

export const dynamic = 'force-dynamic'

export default async function IntegrazioniPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const tenantId = session.tenantId!

  const integration = await getIntegrationByTenant(tenantId)

  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID ?? ''
  const configId = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ?? ''

  return (
    <div className="min-h-full space-y-6 bg-background px-6 py-8 lg:px-8">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div>
          <h1 className="font-heading text-5xl leading-none text-ink">
            Integrazioni
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Collega i tuoi strumenti esterni a filo.
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-5">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Torna alle impostazioni
        </Link>

        <WhatsAppConnectCard
          integration={
            integration
              ? {
                  id: integration.id,
                  status: integration.status,
                  display_phone_number: integration.display_phone_number,
                  verified_name: integration.verified_name,
                  last_error: integration.last_error,
                  connected_at: integration.connected_at,
                }
              : null
          }
          metaAppId={metaAppId}
          configId={configId}
          isAdmin={session.role === 'tenant_admin'}
        />
      </div>
    </div>
  )
}
