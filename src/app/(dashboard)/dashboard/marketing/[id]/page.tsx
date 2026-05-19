import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BackButton } from '@/components/dashboard/BackButton'
import { CampaignActions } from '@/components/marketing/CampaignActions'
import { CampaignPreview } from '@/components/marketing/CampaignPreview'
import { RecipientsList } from '@/components/marketing/RecipientsList'
import type {
  NewsletterCampaignRow,
  NewsletterRecipientRow,
} from '@/lib/newsletter/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_LABEL = {
  draft: 'Bozza',
  approved: 'Approvata',
  sending: 'In invio',
  sent: 'Inviata',
  cancelled: 'Annullata',
} satisfies Record<NewsletterCampaignRow['status'], string>

const STATUS_CHIP = {
  draft:
    'bg-muted text-muted-foreground border border-border',
  approved:
    'bg-primary/10 text-primary border border-primary/20',
  sending:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/30',
  sent:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30',
  cancelled:
    'bg-muted text-muted-foreground/60 border border-border',
} satisfies Record<NewsletterCampaignRow['status'], string>

const OCCASION_LABEL = {
  new_fabric: 'Nuovo tessuto',
  seasonal: 'Stagione',
  event: 'Evento',
  custom: 'Personalizzata',
} satisfies Record<NewsletterCampaignRow['occasion'], string>

interface RecipientWithClient extends NewsletterRecipientRow {
  clients: {
    first_name: string
    last_name: string
    email: string | null
  } | null
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  // Cast per accesso a tabelle non in Database type
  const campRes = await (
    supabase.from('newsletter_campaigns') as unknown as {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          eq: (k: string, v: unknown) => {
            single: () => Promise<{
              data: NewsletterCampaignRow | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  )
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tid)
    .single()

  if (campRes.error || !campRes.data) notFound()
  const campaign = campRes.data

  const recipientsRes = await (
    supabase.from('newsletter_recipients') as unknown as {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          order: (k: string, v: { ascending: boolean }) => Promise<{
            data: RecipientWithClient[] | null
            error: { message: string } | null
          }>
        }
      }
    }
  )
    .select('*, clients(first_name, last_name, email)')
    .eq('campaign_id', id)
    .order('rendered_subject', { ascending: true })

  const recipients = recipientsRes.data ?? []
  const firstWithBody = recipients.find((r) => r.rendered_body)

  const costEur = (campaign.ai_cost_cents / 100).toFixed(4)

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div className="flex-1">
          <BackButton fallbackHref="/dashboard/marketing" label="Marketing" />
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-4xl text-ink leading-none">
              {campaign.title}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[campaign.status]}`}
            >
              {STATUS_LABEL[campaign.status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {OCCASION_LABEL[campaign.occasion]} · creata il{' '}
            {new Date(campaign.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Destinatari" value={campaign.recipients_count.toString()} />
        <StatCard
          label="Inviate"
          value={
            campaign.sent_count > 0
              ? campaign.sent_count.toString()
              : campaign.status === 'sent' || campaign.status === 'sending'
                ? campaign.sent_count.toString()
                : '—'
          }
        />
        <StatCard
          label="Costo AI"
          value={`$${costEur}`}
          hint={`${campaign.ai_model ?? '—'}`}
        />
        <StatCard
          label="Inviata il"
          value={
            campaign.sent_at
              ? new Date(campaign.sent_at).toLocaleDateString('it-IT')
              : '—'
          }
        />
      </div>

      {/* Actions */}
      <CampaignActions
        campaignId={campaign.id}
        status={campaign.status}
        recipientsCount={campaign.recipients_count}
      />

      {/* Preview prima newsletter */}
      {firstWithBody && (
        <CampaignPreview
          subject={firstWithBody.rendered_subject}
          html={firstWithBody.rendered_body}
          recipientName={`${firstWithBody.clients?.first_name ?? ''} ${firstWithBody.clients?.last_name ?? ''}`.trim()}
        />
      )}

      {/* Lista recipients */}
      <RecipientsList recipients={recipients} />
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-medium tabular-nums text-foreground">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  )
}
