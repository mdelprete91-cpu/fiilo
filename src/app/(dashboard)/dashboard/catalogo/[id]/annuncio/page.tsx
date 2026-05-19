import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BackButton } from '@/components/dashboard/BackButton'
import { AnnouncementPreview } from '@/components/catalogo/AnnouncementPreview'

interface PageProps {
  params: Promise<{ id: string }>
}

// Local row types: le nuove tabelle di migration 023 non sono ancora nei type
// generati di Database. Le query usano cast espliciti.

interface AnnouncementRow {
  id: string
  client_id: string
  status: 'pending_review' | 'approved' | 'sent' | 'failed' | 'skipped'
  match_score: number | null
  match_reason: string | null
  message_body: string | null
  sent_at: string | null
  error: string | null
}

interface ClientRowLite {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  marketing_optout: boolean | null
}

interface SettingsRow {
  monthly_cap: number
  current_month_sent: number
  marketing_enabled: boolean
}

interface IntegrationLite {
  status: string
  phone_number_id: string
}

interface TemplateLite {
  status: string
  name: string
}

export default async function AnnuncioPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const { data: fabric } = await supabase
    .from('fabrics')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tid)
    .single()

  if (!fabric) notFound()

  // Pending preview rows
  const annRes = (await supabase
    .from('fabric_announcements' as never)
    .select('id, client_id, status, match_score, match_reason, message_body, sent_at, error')
    .eq('tenant_id', tid)
    .eq('fabric_id', id)
    .order('match_score', { ascending: false })) as unknown as {
    data: AnnouncementRow[] | null
  }
  const announcements: AnnouncementRow[] = annRes.data ?? []

  const clientIds = announcements.map((a) => a.client_id)
  const clientsRes = clientIds.length
    ? ((await supabase
        .from('clients')
        .select('id, first_name, last_name, phone, marketing_optout' as never)
        .eq('tenant_id', tid)
        .in('id', clientIds)) as unknown as { data: ClientRowLite[] | null })
    : { data: [] as ClientRowLite[] }

  const clientMap = new Map<string, ClientRowLite>()
  for (const c of clientsRes.data ?? []) clientMap.set(c.id, c)

  const items = announcements.map((a) => {
    const c = clientMap.get(a.client_id)
    return {
      announcementId: a.id,
      clientId: a.client_id,
      clientName: c ? `${c.first_name} ${c.last_name}` : 'Cliente',
      clientPhone: c?.phone ?? null,
      optedOut: !!c?.marketing_optout,
      status: a.status,
      matchScore: a.match_score ?? 0,
      matchReason: a.match_reason ?? '',
      messageBody: a.message_body ?? '',
      sentAt: a.sent_at,
      error: a.error,
    }
  })

  // Settings + integration + template (informativi per UI)
  const [settingsRes, integrationRes, templateRes] = await Promise.all([
    supabase
      .from('tenant_marketing_settings' as never)
      .select('monthly_cap, current_month_sent, marketing_enabled')
      .eq('tenant_id', tid)
      .maybeSingle() as unknown as Promise<{ data: SettingsRow | null }>,
    supabase
      .from('whatsapp_integrations')
      .select('status, phone_number_id')
      .eq('tenant_id', tid)
      .maybeSingle() as unknown as Promise<{ data: IntegrationLite | null }>,
    supabase
      .from('whatsapp_message_templates' as never)
      .select('status, name')
      .eq('tenant_id', tid)
      .eq('name', 'fabric_announcement_it')
      .eq('language', 'it')
      .maybeSingle() as unknown as Promise<{ data: TemplateLite | null }>,
  ])
  const settings = settingsRes.data
  const integration = integrationRes.data
  const template = templateRes.data

  const blockers: string[] = []
  if (!integration || integration.status !== 'connected') {
    blockers.push('WhatsApp non collegato per questo tenant.')
  }
  if (!template || template.status !== 'approved') {
    blockers.push(
      'Template "fabric_announcement_it" non approvato. Sottomettilo in Meta Business Suite e registralo.',
    )
  }
  if (settings && settings.marketing_enabled === false) {
    blockers.push('Marketing WhatsApp disabilitato nelle settings del tenant.')
  }
  if (!fabric.image_url) {
    blockers.push('Il tessuto non ha foto: aggiungi image_url prima di annunciarlo.')
  }

  return (
    <div className="min-h-full bg-background space-y-6 p-6 lg:p-8">
      <BackButton fallbackHref="/dashboard/catalogo" label="Torna al catalogo" />
      <TopBar
        role={session.role as never}
        userName={session.fullName ?? session.email ?? undefined}
        title={`Annuncia: ${fabric.name}`}
        subtitle="Invio WhatsApp ai clienti potenzialmente interessati"
      />

      <AnnouncementPreview
        fabric={{
          id: fabric.id,
          name: fabric.name,
          mill: fabric.mill,
          composition: fabric.composition,
          color: fabric.color,
          pattern: fabric.pattern,
          weight_grams: fabric.weight_grams,
          season: fabric.season,
          image_url: fabric.image_url,
          price_per_meter: fabric.price_per_meter,
        }}
        items={items}
        blockers={blockers}
        cap={{
          monthlyCap: settings?.monthly_cap ?? 50,
          currentMonthSent: settings?.current_month_sent ?? 0,
        }}
      />
    </div>
  )
}
