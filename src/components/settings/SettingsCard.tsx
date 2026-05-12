'use client'

import { Check, Loader2 } from 'lucide-react'

/**
 * Primitive condivise dei moduli Settings (dashboard + platform).
 * Stesso pattern Card-based con header small-caps + body + footer pill action.
 */

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {children}
    </section>
  )
}

export function CardHeader({
  label,
  description,
  action,
}: {
  label: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-4 pt-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardFooter({
  isPending,
  result,
  label,
}: {
  isPending: boolean
  result: { success: boolean; error?: string } | null
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3">
      <div className="text-xs">
        {result?.success && (
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Salvato
          </span>
        )}
        {result?.error && <span className="text-destructive">{result.error}</span>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
    </div>
  )
}

export function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  placeholder,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-xs font-medium text-muted-foreground"
      >
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-foreground/40">
            *
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  )
}

export function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          accent
            ? 'text-sm font-medium text-foreground'
            : 'text-sm text-foreground'
        }
      >
        {value}
      </dd>
    </div>
  )
}
