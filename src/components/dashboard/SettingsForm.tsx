'use client'

import { useTransition, useState, useRef } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'
import {
  updateMyTenantAction,
  updateMyProfileAction,
  updateLanguageAction,
  inviteTeamMemberAction,
  removeTeamMemberAction,
} from '@/lib/actions/tenants'
import { Card, CardFooter, CardHeader, Field, Row } from '@/components/settings/SettingsCard'

interface TenantData {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
}

interface ProfileData {
  full_name: string | null
  email: string | undefined
}

export interface TeamMember {
  roleId: string
  userId: string
  name: string | null
  email: string | null
  role: string
}

interface Props {
  tenant: TenantData
  profile: ProfileData
  isAdmin: boolean
  plan: string
  memberSince: string
  currentUserId: string
  team: TeamMember[]
  preferredLanguage: string
}

export function SettingsForm({
  tenant,
  profile,
  isAdmin,
  plan,
  memberSince,
  currentUserId,
  team,
  preferredLanguage,
}: Props) {
  return (
    <div className="space-y-5">
      {isAdmin && <SartoriaCard tenant={tenant} />}
      {isAdmin && <TeamCard team={team} currentUserId={currentUserId} />}
      <ProfiloCard profile={profile} />
      <LinguaCard currentLanguage={preferredLanguage} />
      <AccountCard plan={plan} memberSince={memberSince} />
    </div>
  )
}

/* ────────────────────  SARTORIA  ──────────────────── */

function SartoriaCard({ tenant }: { tenant: TenantData }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setResult(null)
    startTransition(async () => {
      const res = await updateMyTenantAction(fd)
      setResult(res)
    })
  }

  return (
    <Card>
      <CardHeader
        label="La sartoria"
        description="Informazioni di contatto visibili ai clienti."
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome sartoria" name="name" defaultValue={tenant.name} required />
            <Field
              label="Email di contatto"
              name="email"
              type="email"
              defaultValue={tenant.email ?? ''}
            />
            <Field
              label="Telefono"
              name="phone"
              type="tel"
              defaultValue={tenant.phone ?? ''}
            />
            <Field label="Città" name="city" defaultValue={tenant.city ?? ''} />
          </div>
          <Field label="Indirizzo" name="address" defaultValue={tenant.address ?? ''} />
        </div>
        <CardFooter isPending={isPending} result={result} label="Salva modifiche" />
      </form>
    </Card>
  )
}

/* ────────────────────  TEAM  ──────────────────── */

const ROLE_LABEL: Record<string, string> = {
  tenant_admin: 'Admin',
  tenant_staff: 'Staff',
}

function TeamCard({
  team,
  currentUserId,
}: {
  team: TeamMember[]
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
    const email = fd.get('email') as string
    setInviteResult(null)
    startInvite(async () => {
      const res = await inviteTeamMemberAction(fd)
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
    removeTeamMemberAction(roleId).finally(() => setRemovingId(null))
  }

  return (
    <Card>
      <CardHeader
        label="Team"
        description="Chi ha accesso al gestionale."
      />
      <ul className="divide-y divide-border">
        {team.map((member) => (
          <li
            key={member.roleId}
            className="flex items-center justify-between px-6 py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {member.name ?? member.email ?? '—'}
              </p>
              {member.name && member.email && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              )}
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {ROLE_LABEL[member.role] ?? member.role}
              </span>
              {member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.roleId)}
                  disabled={removingId === member.roleId}
                  title="Rimuovi dal team"
                  className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  {removingId === member.roleId ? (
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
        className="space-y-3 border-t border-border bg-muted/30 p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Invita un membro
        </p>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input
            name="email"
            type="email"
            required
            placeholder="email@esempio.com"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <select
            name="role"
            defaultValue="tenant_staff"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="tenant_staff">Staff</option>
            <option value="tenant_admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={invitePending}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
          >
            {invitePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Invia invito
          </button>
        </div>

        {inviteResult?.success && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Invito inviato a <strong>{inviteResult.email}</strong>
          </p>
        )}
        {inviteResult?.error && (
          <p className="text-xs text-destructive">{inviteResult.error}</p>
        )}
      </form>
    </Card>
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
      const res = await updateMyProfileAction(fd)
      setResult(res)
    })
  }

  return (
    <Card>
      <CardHeader
        label="Profilo"
        description="Il tuo nome visibile all'interno del gestionale."
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

/* ────────────────────  LINGUA  ──────────────────── */

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

function LinguaCard({ currentLanguage }: { currentLanguage: string }) {
  const [selected, setSelected] = useState(currentLanguage)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSelect(code: string) {
    if (code === selected || isPending) return
    setSelected(code)
    setSaved(false)
    startTransition(async () => {
      const res = await updateLanguageAction(code)
      if (res.success) setSaved(true)
    })
  }

  return (
    <Card>
      <CardHeader
        label="Lingua"
        description="La lingua dell'interfaccia del gestionale."
      />
      <div className="space-y-3 p-6">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              disabled={isPending}
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                selected === lang.code
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
        {saved && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Salvato
          </p>
        )}
      </div>
    </Card>
  )
}

/* ────────────────────  ACCOUNT  ──────────────────── */

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

function AccountCard({ plan, memberSince }: { plan: string; memberSince: string }) {
  return (
    <Card>
      <CardHeader label="Account" />
      <dl className="divide-y divide-border">
        <Row label="Piano" value={PLAN_LABEL[plan] ?? plan} />
        <Row label="Attivo dal" value={memberSince} />
      </dl>
    </Card>
  )
}

