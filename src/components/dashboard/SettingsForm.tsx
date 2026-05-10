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

export function SettingsForm({ tenant, profile, isAdmin, plan, memberSince, currentUserId, team, preferredLanguage }: Props) {
  return (
    <div className="space-y-12">
      {isAdmin && <SartoriaSection tenant={tenant} />}
      {isAdmin && <TeamSection team={team} currentUserId={currentUserId} />}
      <ProfiloSection profile={profile} />
      <LinguaSection currentLanguage={preferredLanguage} />
      <AccountSection plan={plan} memberSince={memberSince} />
    </div>
  )
}

// ─── Sezione sartoria ────────────────────────────────────────────────────────

function SartoriaSection({ tenant }: { tenant: TenantData }) {
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
    <section>
      <SectionHeader
        title="La sartoria"
        description="Informazioni di contatto visibili ai clienti."
      />
      <div className="rounded-sm border border-border bg-card shadow-card">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome sartoria *" name="name" defaultValue={tenant.name} required />
            <Field label="Email di contatto" name="email" type="email" defaultValue={tenant.email ?? ''} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefono" name="phone" type="tel" defaultValue={tenant.phone ?? ''} />
            <Field label="Città" name="city" defaultValue={tenant.city ?? ''} />
          </div>
          <Field label="Indirizzo" name="address" defaultValue={tenant.address ?? ''} />
          <FormFooter isPending={isPending} result={result} label="Salva modifiche" />
        </form>
      </div>
    </section>
  )
}

// ─── Sezione team ─────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  tenant_admin: 'Admin',
  tenant_staff: 'Staff',
}

function TeamSection({ team, currentUserId }: { team: TeamMember[]; currentUserId: string }) {
  const [invitePending, startInvite] = useTransition()
  const [inviteResult, setInviteResult] = useState<{ success: boolean; error?: string; email?: string } | null>(null)
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
    <section>
      <SectionHeader
        title="Team"
        description="Gestisci chi ha accesso al gestionale."
      />
      <div className="rounded-sm border border-border bg-card divide-y divide-border">

        {/* Lista membri */}
        {team.map((member) => (
          <div key={member.roleId} className="flex items-center justify-between px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">
                {member.name ?? member.email ?? '—'}
              </p>
              {member.name && member.email && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.email}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {ROLE_LABEL[member.role] ?? member.role}
              </span>
              {member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.roleId)}
                  disabled={removingId === member.roleId}
                  title="Rimuovi dal team"
                  className="rounded-sm p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  {removingId === member.roleId
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Form invito */}
        <form ref={formRef} onSubmit={handleInvite} className="px-6 py-5 space-y-4 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">
            Invita un nuovo membro
          </p>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <input
              name="email"
              type="email"
              required
              placeholder="email@esempio.com"
              className="flex-1 min-w-0 rounded-sm border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            />
            <select
              name="role"
              defaultValue="tenant_staff"
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            >
              <option value="tenant_staff">Staff</option>
              <option value="tenant_admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={invitePending}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97] will-change-transform whitespace-nowrap"
            >
              {invitePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Invia invito
            </button>
          </div>

          {inviteResult?.success && (
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="h-3.5 w-3.5" />
              Invito inviato a <strong>{inviteResult.email}</strong>
            </p>
          )}
          {inviteResult?.error && (
            <p className="text-xs text-destructive">{inviteResult.error}</p>
          )}
        </form>
      </div>
    </section>
  )
}

// ─── Sezione profilo personale ────────────────────────────────────────────────

function ProfiloSection({ profile }: { profile: ProfileData }) {
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
    <section>
      <SectionHeader
        title="Profilo personale"
        description="Il tuo nome visibile all'interno del gestionale."
      />
      <div className="rounded-sm border border-border bg-card shadow-card">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" name="full_name" defaultValue={profile.full_name ?? ''} />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Email account
              </p>
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

// ─── Sezione lingua ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
]

function LinguaSection({ currentLanguage }: { currentLanguage: string }) {
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
    <section>
      <SectionHeader
        title="Lingua"
        description="La lingua dell'interfaccia del gestionale."
      />
      <div className="rounded-sm border border-border bg-card shadow-card">
        <div className="p-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                disabled={isPending}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-sm border text-sm font-medium transition-all disabled:opacity-50 ${
                  selected === lang.code
                    ? 'bg-ink border-ink text-background'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
          {saved && (
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <Check className="h-3.5 w-3.5" /> Salvato
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Sezione account (read-only) ─────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

function AccountSection({ plan, memberSince }: { plan: string; memberSince: string }) {
  return (
    <section>
      <SectionHeader title="Account" />
      <div className="rounded-sm border border-border bg-card divide-y divide-border">
        <ReadRow label="Piano" value={PLAN_LABEL[plan] ?? plan} accent />
        <ReadRow label="Attivo dal" value={memberSince} />
      </div>
    </section>
  )
}

// ─── Componenti atomici ───────────────────────────────────────────────────────

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

function Field({
  label, name, type = 'text', defaultValue, required,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
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
