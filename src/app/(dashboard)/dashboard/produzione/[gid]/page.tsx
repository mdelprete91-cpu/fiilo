import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { GarmentSpecSheet } from '@/components/dashboard/GarmentSpecSheet'
import { GarmentSidebar } from '@/components/dashboard/GarmentSidebar'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

interface PageProps {
  params: Promise<{ gid: string }>
}

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi', suit_3pc: 'Abito 3 pezzi', jacket: 'Giacca',
  trousers: 'Pantalone', waistcoat: 'Gilet', coat: 'Soprabito',
  tuxedo: 'Smoking', shirt: 'Camicia',
}

const STATUS_DOT: Record<string, string> = {
  confirmed:     'oklch(0.35 0.07 250)',
  in_production: 'oklch(0.58 0.13 55)',
  ready:         'oklch(0.28 0.07 155)',
  delivered:     'oklch(0.55 0.005 80 / 0.35)',
}
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confermato', in_production: 'In lavorazione',
  ready: 'Pronto', delivered: 'Consegnato',
}

export default async function ProduzioneDettaglioPage({ params }: PageProps) {
  const { gid } = await params
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const { data: garment } = await supabase
    .from('garments')
    .select('id, name, type, status, total_price, deposit_amount, currency, delivery_eta, internal_notes, payment_mode, payment_status, client_id, configuration')
    .eq('id', gid)
    .eq('tenant_id', tid)
    .single()

  if (!garment) notFound()

  const [{ data: client }, fabrics, linings, buttons, threads] = await Promise.all([
    supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, city, address')
      .eq('id', garment.client_id)
      .eq('tenant_id', tid)
      .single(),
    supabase.from('fabrics').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('linings').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('buttons').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('thread_colors').select('*').eq('tenant_id', tid).order('name'),
  ])

  if (!client) notFound()

  if (garment.status === 'draft') {
    redirect(`/dashboard/clienti/${client.id}/abiti/${garment.id}?from=produzione`)
  }

  const garmentTitle = garment.name ?? TYPE_LABEL[garment.type] ?? garment.type
  const statusDot   = STATUS_DOT[garment.status]
  const statusLabel = STATUS_LABEL[garment.status] ?? garment.status

  return (
    <div className="min-h-full bg-background">

      {/* Breadcrumb */}
      <div className="border-b border-border px-6 py-3 bg-card">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard/produzione" className="hover:text-foreground transition-colors">
            Produzione
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-foreground font-medium">{garmentTitle}</span>
        </nav>
      </div>

      {/* Page header */}
      <div className="border-b border-border/40 bg-background px-6 py-6 lg:px-8">
        <div>
          <h1 className="font-heading text-3xl text-ink leading-tight">{garmentTitle}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Link
              href={`/dashboard/clienti/${client.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {client.first_name} {client.last_name}
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1.5">
              {statusDot && (
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: statusDot }} />
              )}
              <span className="text-sm text-muted-foreground">{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">

          {/* ── Sidebar (sinistra) ───────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-6">
            <GarmentSidebar
              garment={{
                id: garment.id,
                status: garment.status,
                total_price: garment.total_price,
                deposit_amount: garment.deposit_amount ?? null,
                currency: garment.currency ?? 'EUR',
                delivery_eta: garment.delivery_eta,
                internal_notes: garment.internal_notes,
                payment_mode: garment.payment_mode,
                payment_status: garment.payment_status ?? 'pending',
              }}
              client={{
                id: client.id,
                first_name: client.first_name,
                last_name: client.last_name,
                email: client.email,
                phone: client.phone,
                city: client.city,
                address: client.address,
              }}
              tenantId={tid}
            />
          </aside>

          {/* ── Specifica tecnica (colonna principale) ───────────────────────── */}
          <div>
            <div className="rounded-sm border border-border bg-card overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Specifica tecnica
                </p>
                <Link
                  href={`/dashboard/clienti/${client.id}/abiti/${garment.id}?edit=1`}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Modifica
                </Link>
              </div>
              <GarmentSpecSheet
                configuration={garment.configuration as Record<string, unknown> | null}
                fabrics={(fabrics.data ?? []) as Fabric[]}
                linings={(linings.data ?? []) as Lining[]}
                buttons={(buttons.data ?? []) as ButtonType[]}
                threadColors={(threads.data ?? []) as ThreadColor[]}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
