import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { ConfiguratoreShell } from '@/components/configuratore/ConfiguratoreShell'
import { OrdinePanel } from '@/components/dashboard/OrdinePanel'
import { mergeConfigWithDefaults } from '@/lib/configuratore/defaults'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string; gid: string }>
  searchParams: Promise<{ edit?: string; from?: string }>
}

export default async function ConfiguratorePage({ params, searchParams }: PageProps) {
  const { id: clientId, gid: garmentId } = await params
  const { edit, from } = await searchParams
  const isEditMode = edit === '1'
  const origin: 'produzione' | 'clienti' = from === 'produzione' ? 'produzione' : 'clienti'
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const [{ data: client }, { data: garment }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('id', clientId)
      .eq('tenant_id', tid)
      .single(),
    supabase
      .from('garments')
      .select('id, name, type, status, total_price, currency, delivery_eta, internal_notes, payment_mode, payment_status, current_step, configuration')
      .eq('id', garmentId)
      .eq('tenant_id', tid)
      .single(),
  ])

  if (!client || !garment) notFound()

  // Non-draft garments → production management panel (unless edit mode requested)
  if (garment.status !== 'draft' && !isEditMode) {
    return (
      <OrdinePanel
        garment={{
          id: garment.id,
          name: garment.name,
          type: garment.type,
          status: garment.status,
          total_price: garment.total_price,
          currency: garment.currency ?? 'EUR',
          delivery_eta: garment.delivery_eta,
          internal_notes: garment.internal_notes,
          payment_mode: garment.payment_mode,
          payment_status: garment.payment_status ?? 'pending',
        }}
        client={{ id: client.id, first_name: client.first_name, last_name: client.last_name }}
        tenantId={tid}
      />
    )
  }

  // Draft or edit mode → configuratore
  const [fabrics, linings, buttons, threads, measurementsCountResult] = await Promise.all([
    supabase.from('fabrics').select('*').eq('tenant_id', tid).eq('is_available', true).order('name'),
    supabase.from('linings').select('*').eq('tenant_id', tid).eq('is_available', true).order('name'),
    supabase.from('buttons').select('*').eq('tenant_id', tid).eq('is_available', true).order('name'),
    supabase.from('thread_colors').select('*').eq('tenant_id', tid).eq('is_available', true).order('name'),
    supabase
      .from('client_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('tenant_id', tid),
  ])

  const config = mergeConfigWithDefaults(garment.configuration ?? {})
  const initialStep = isEditMode ? 'setup.type' : (garment.current_step ?? 'setup.type')
  const measurementsCount = measurementsCountResult.count ?? 0

  return (
    <ConfiguratoreShell
      garmentId={garmentId}
      clientId={clientId}
      clientName={`${client.first_name} ${client.last_name}`}
      garmentName={garment.name ?? 'Nuovo abito'}
      initialStep={initialStep}
      initialConfig={config}
      measurementsCount={measurementsCount}
      origin={origin}
      fabrics={(fabrics.data ?? []) as Fabric[]}
      linings={(linings.data ?? []) as Lining[]}
      buttons={(buttons.data ?? []) as ButtonType[]}
      threadColors={(threads.data ?? []) as ThreadColor[]}
    />
  )
}
