'use client'

import { useTransition, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { updatePlatformOwnerProfileAction } from '@/lib/actions/tenants'

interface Props {
  profile: {
    full_name: string | null
    email: string | undefined
  }
  stats: {
    totalTenants: number
    totalClients: number
    totalGarments: number
  }
  joinedAt: string
}

export function PlatformSettingsForm({ profile, stats, joinedAt }: Props) {
  return (
    <div className="space-y-12">
      <ProfiloSection profile={profile} />
      <AccountSection stats={stats} joinedAt={joinedAt} />
    </div>
  )
}

function ProfiloSection({ profile }: { profile: Props['profile'] }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setResult(null)
    startTransition(async () => {
      const res = await updatePlatformOwnerProfileAction(fd)
      setResult(res)
    })
  }

  return (
    <section>
      <SectionHeader
        title="Profilo personale"
        description="Il tuo nome visibile nella piattaforma."
      />
      <div className="rounded-sm border border-border bg-card shadow-card">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" name="full_name" defaultValue={profile.full_name ?? ''} />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Email account</p>
              <p className="text-sm text-muted-foreground py-2 border-b border-border/60">
                {profile.email ?? '—'}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Per cambiare l&apos;email contatta il supporto.
              </p>
            </div>
          </div>
          <FormFooter isPending={isPending} result={result} label="Salva profilo" />
        </form>
      </div>
    </section>
  )
}

function AccountSection({ stats, joinedAt }: { stats: Props['stats']; joinedAt: string }) {
  return (
    <section>
      <SectionHeader
        title="Piattaforma"
        description="Riepilogo attività sulla piattaforma."
      />
      <div className="rounded-sm border border-border bg-card divide-y divide-border">
        <ReadRow label="Ruolo" value="Platform Owner" accent />
        <ReadRow label="Attivo dal" value={joinedAt} />
        <ReadRow label="Sartorie registrate" value={stats.totalTenants.toString()} />
        <ReadRow label="Clienti totali" value={stats.totalClients.toString()} />
        <ReadRow label="Abiti configurati" value={stats.totalGarments.toString()} />
      </div>
    </section>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
      />
    </div>
  )
}

function FormFooter({
  isPending,
  result,
  label,
}: {
  isPending: boolean
  result: { success: boolean; error?: string } | null
  label: string
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      {result?.success && (
        <span className="flex items-center gap-1.5 text-xs text-primary">
          <Check className="h-3.5 w-3.5" /> Salvato
        </span>
      )}
      {result?.error && (
        <span className="text-xs text-destructive">{result.error}</span>
      )}
      {!result && <span />}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97] will-change-transform"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
    </div>
  )
}

function ReadRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className={accent ? 'text-sm font-semibold text-primary' : 'text-sm text-foreground'}>
        {value}
      </span>
    </div>
  )
}
