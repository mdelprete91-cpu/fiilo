import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { PortalTenant } from '@/types/customer-portal'

export default async function TenantPortalLayout({
  children,
  params,
}: LayoutProps<'/c/[tenantSlug]'>) {
  const { tenantSlug } = await params

  const supabase = await createClient()
  // RPC nuova (migration 021), non ancora nei types autogenerati.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantRow } = await (supabase.rpc as any)(
    'portal_get_tenant_by_slug',
    { p_slug: tenantSlug },
  )

  const tenant = Array.isArray(tenantRow)
    ? (tenantRow[0] as PortalTenant | undefined)
    : (tenantRow as PortalTenant | null | undefined)
  if (!tenant) notFound()

  const session = await getSession()
  const isAuthed = !!session && session.role === 'customer_end_user' && session.tenantId === tenant.id

  const brand = tenant.brand_color || '#1d1d1d'

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ ['--brand-color' as string]: brand }}
    >
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href={isAuthed ? `/c/${tenantSlug}` : `/c/${tenantSlug}/login`}
            className="flex items-center gap-3"
          >
            {tenant.logo_url ? (
              <span className="relative inline-flex h-9 w-9 overflow-hidden rounded-md bg-muted">
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold text-white"
                style={{ backgroundColor: brand }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-heading text-lg text-ink">{tenant.name}</span>
          </Link>

          {isAuthed && (
            <nav className="hidden gap-5 text-sm md:flex">
              <NavLink href={`/c/${tenantSlug}`} label="Home" />
              <NavLink href={`/c/${tenantSlug}/abiti`} label="Abiti" />
              <NavLink href={`/c/${tenantSlug}/catalogo`} label="Catalogo" />
              <NavLink href={`/c/${tenantSlug}/profilo`} label="Profilo" />
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  )
}
