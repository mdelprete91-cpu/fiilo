'use client'

import { useRef, useState, useTransition } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'

import {
  invitePlatformOwnerAction,
  removePlatformOwnerAction,
  updatePlatformOwnerProfileAction,
} from '@/lib/actions/tenants'
import {
  Card,
  CardFooter,
  CardHeader,
  Field,
  Row,
} from '@/components/settings/SettingsCard'

interface ProfileData {
  full_name: string | null
  email: string | undefined
}

interface Stats {
  totalTenants: number
  totalClients: number
  totalGarments: number
}

export interface PlatformOwner {
  roleId: string
  userId: string
  name: string | null
  email: string | null
}

interface Props {
  profile: ProfileData
  stats: Stats
  joinedAt: string
  owners: PlatformOwner[]
  currentUserId: string
}

export function PlatformSettingsForm({
  profile,
  stats,
  joinedAt,
  owners,
  currentUserId,
}: Props) {
  return (
    <div className="space-y-5">
      <ProfiloCard profile={profile} />
      <SuperAdminCard owners={owners} currentUserId={currentUserId} />
      <PiattaformaCard stats={stats} joinedAt={joinedAt} />
    </div>
  )
}

/* ────────────────────  PROFILO  ──────────────────── */

function ProfiloCard({ profile }: { profile: ProfileData }) {
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
    <Card>
      <CardHeader
        label="Profilo"
        description="Il tuo nome visibile nella piattaforma."
      />
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Field
            label="Nome completo"
            name="full_name"
            defaultValue={profile.full_name ?? ''}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">
              Email account
            </label>
            <p className="py-2.5 text-sm text-foreground">{profile.email ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground/70">
              Per cambiarla contatta il supporto.
            </p>
          </div>
        </div>
        <CardFooter isPending={isPending} result={result} label="Salva profilo" />
      </form>
    </Card>
  )
}

/* ────────────────────  SUPER ADMIN  ──────────────────── */

function SuperAdminCard({
  owners,
  currentUserId,
}: {
  owners: PlatformOwner[]
  currentUserId: string
}) {
  const [invitePending, startInvite] = useTransition()
  const [inviteResult, setInviteResult] = useState<{
    success: boolean
    error?: string
    email?: string
  } | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string) ?? ''
    setInviteResult(null)
    startInvite(async () => {
      const res = await invitePlatformOwnerAction(fd)
      if (res.success) {
        setInviteResult({ success: true, email })
        formRef.current?.reset()
      } else {
        setInviteResult({ success: false, error: res.error })
      }
    })
  }

  function handleRemove(roleId: string) {
    setRemovingId(roleId)
    removePlatformOwnerAction(roleId).finally(() => setRemovingId(null))
  }

  return (
    <Card>
      <CardHeader
        label="Super admin"
        description="Chi ha accesso totale alla piattaforma. Deve restare almeno uno."
      />
      <ul className="divide-y divide-border">
        {owners.map((o) => (
          <li
            key={o.roleId}
            className="flex items-center justify-between px-6 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {o.name ?? o.email ?? '—'}
                {o.userId === currentUserId && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (tu)
                  </span>
                )}
              </p>
              {o.name && o.email && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {o.email}
                </p>
              )}
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Super admin
              </span>
              {o.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(o.roleId)}
                  disabled={removingId === o.roleId}
                  title="Revoca super admin"
                  className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  {removingId === o.roleId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form
        ref={formRef}
        onSubmit={handleInvite}
        className="space-y-4 border-t border-border bg-muted/30 p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Aggiungi super admin
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Nome completo"
            name="full_name"
            placeholder="Mario Bianchi"
            autoComplete="off"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="email@esempio.com"
            required
            autoComplete="off"
          />
        </div>
        <Field
          label="Password temporanea"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="min. 8 caratteri"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs">
            {inviteResult?.success && (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Invitato <strong className="font-medium">{inviteResult.email}</strong>
              </span>
            )}
            {inviteResult?.error && (
              <span className="text-destructive">{inviteResult.error}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={invitePending}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
          >
            {invitePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Aggiungi
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          Il nuovo super admin riceverà l’accesso immediato. Comunicagli email +
          password fuori dall’app. Potrà cambiare password al primo login.
        </p>
      </form>
    </Card>
  )
}

/* ────────────────────  PIATTAFORMA (read-only)  ──────────────────── */

function PiattaformaCard({ stats, joinedAt }: { stats: Stats; joinedAt: string }) {
  return (
    <Card>
      <CardHeader label="Piattaforma" description="Riepilogo attività." />
      <dl className="divide-y divide-border">
        <Row label="Attivo dal" value={joinedAt} />
        <Row label="Sartorie registrate" value={stats.totalTenants.toString()} accent />
        <Row label="Clienti totali" value={stats.totalClients.toString()} accent />
        <Row label="Abiti configurati" value={stats.totalGarments.toString()} accent />
      </dl>
    </Card>
  )
}
