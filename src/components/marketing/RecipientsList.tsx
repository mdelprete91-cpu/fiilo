import type { NewsletterRecipientRow, RecipientStatus } from '@/lib/newsletter/types'

interface RecipientWithClient extends NewsletterRecipientRow {
  clients: {
    first_name: string
    last_name: string
    email: string | null
  } | null
}

interface RecipientsListProps {
  recipients: RecipientWithClient[]
}

const STATUS_LABEL: Record<RecipientStatus, string> = {
  pending: 'In attesa',
  sent: 'Inviata',
  delivered: 'Consegnata',
  opened: 'Aperta',
  clicked: 'Cliccata',
  failed: 'Fallita',
  unsubscribed: 'Disiscritta',
}

const STATUS_CHIP: Record<RecipientStatus, string> = {
  pending:
    'bg-muted text-muted-foreground border border-border',
  sent:
    'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800/30',
  delivered:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30',
  opened:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30',
  clicked:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30',
  failed:
    'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800/30',
  unsubscribed:
    'bg-muted text-muted-foreground/60 border border-border',
}

export function RecipientsList({ recipients }: RecipientsListProps) {
  if (recipients.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nessun destinatario per questa campagna.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium text-foreground">
          Destinatari ({recipients.length})
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Cliente
              </th>
              <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">
                Email
              </th>
              <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">
                Oggetto
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipients.map((r) => {
              const fullName = r.clients
                ? `${r.clients.first_name} ${r.clients.last_name}`
                : '—'
              return (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-foreground">{fullName}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                    {r.clients?.email ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="hidden px-5 py-3 text-muted-foreground lg:table-cell max-w-[300px] truncate">
                    {r.rendered_subject ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[r.status]}`}
                      title={r.error_message ?? undefined}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
