import Link from 'next/link'
import { Plus, Mail } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import type { NewsletterCampaignRow } from '@/lib/newsletter/types'

const STATUS_LABEL: Record<NewsletterCampaignRow['status'], string> = {
  draft: 'Bozza',
  approved: 'Approvata',
  sending: 'In invio',
  sent: 'Inviata',
  cancelled: 'Annullata',
}

const STATUS_CHIP: Record<NewsletterCampaignRow['status'], string> = {
  draft:
    'bg-muted text-muted-foreground border border-border',
  approved:
    'bg-primary/10 text-primary border border-primary/20',
  sending:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/30',
  sent:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30',
  cancelled:
    'bg-muted text-muted-foreground/60 border border-border line-through',
}

const OCCASION_LABEL: Record<NewsletterCampaignRow['occasion'], string> = {
  new_fabric: 'Nuovo tessuto',
  seasonal: 'Stagione',
  event: 'Evento',
  custom: 'Personalizzata',
}

export default async function MarketingPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  // Lista campagne. Cast forzato perché src/types/database.ts non ha la tabella.
  const res = await (
    supabase.from('newsletter_campaigns') as unknown as {
      select: (q: string) => {
        eq: (k: string, v: unknown) => {
          order: (k: string, v: { ascending: boolean }) => {
            limit: (n: number) => Promise<{
              data: NewsletterCampaignRow[] | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  )
    .select('*')
    .eq('tenant_id', tid)
    .order('created_at', { ascending: false })
    .limit(100)

  const campaigns = res.data ?? []

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TopBar role={session.role} userName={session.fullName ?? session.email} />
          <div>
            <h1 className="font-heading text-5xl text-ink leading-none">Marketing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Newsletter personalizzate via email per i tuoi clienti
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/marketing/nuova"
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors will-change-transform"
        >
          <Plus className="h-4 w-4" />
          Nuova campagna
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-medium text-foreground">
            Nessuna campagna ancora
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Inizia creando la prima newsletter per i tuoi clienti.
          </p>
          <Link
            href="/dashboard/marketing/nuova"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Crea la prima
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Titolo
                </th>
                <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">
                  Occasione
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Stato
                </th>
                <th className="hidden px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:table-cell">
                  Destinatari
                </th>
                <th className="hidden px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">
                  Inviate
                </th>
                <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">
                  Creata il
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/marketing/${c.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                    {OCCASION_LABEL[c.occasion]}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 text-right tabular-nums text-foreground sm:table-cell">
                    {c.recipients_count}
                  </td>
                  <td className="hidden px-5 py-4 text-right tabular-nums text-foreground lg:table-cell">
                    {c.sent_count > 0 ? c.sent_count : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                    {new Date(c.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/marketing/${c.id}`}
                      className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Apri →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
