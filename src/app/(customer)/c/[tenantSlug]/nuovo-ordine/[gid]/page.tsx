import { notFound } from 'next/navigation'
import { requireCustomerContext } from '@/lib/auth/customer-guard'
import { createClient } from '@/lib/supabase/server'
import { CustomerConfiguratore } from '@/components/customer/CustomerConfiguratore'
import { mergeConfigWithDefaults } from '@/lib/configuratore/defaults'
import type { Fabric, Lining, Button as ButtonType, ThreadColor } from '@/types/database'

interface PageProps {
  params: Promise<{ tenantSlug: string; gid: string }>
}

export default async function CustomerNuovoOrdinePage({ params }: PageProps) {
  const { tenantSlug, gid } = await params
  const ctx = await requireCustomerContext(tenantSlug)
  const supabase = await createClient()

  const [{ data: client }, { data: garment }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('id', ctx.clientId)
      .single(),
    supabase
      .from('garments')
      .select('id, name, type, status, current_step, configuration, client_id')
      .eq('id', gid)
      .eq('client_id', ctx.clientId)
      .single(),
  ])

  if (!client || !garment) notFound()

  // Sicurezza extra: il cliente può configurare solo abiti in draft/submitted
  // (la RLS lo applica già, ma diamo un messaggio chiaro).
  // 'submitted' è enum aggiunto dalla migration 021 — non ancora nei types.
  const status = garment.status as string
  if (status !== 'draft' && status !== 'submitted') {
    notFound()
  }

  const [fabrics, linings, buttons, threads, measurementsCountResult] = await Promise.all([
    supabase
      .from('fabrics')
      .select('*')
      .eq('tenant_id', ctx.tenant.id)
      .eq('is_available', true)
      .order('name'),
    supabase
      .from('linings')
      .select('*')
      .eq('tenant_id', ctx.tenant.id)
      .eq('is_available', true)
      .order('name'),
    supabase
      .from('buttons')
      .select('*')
      .eq('tenant_id', ctx.tenant.id)
      .eq('is_available', true)
      .order('name'),
    supabase
      .from('thread_colors')
      .select('*')
      .eq('tenant_id', ctx.tenant.id)
      .eq('is_available', true)
      .order('name'),
    supabase
      .from('client_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', ctx.clientId),
  ])

  const config = mergeConfigWithDefaults(garment.configuration ?? {})
  const initialStep = garment.current_step ?? 'setup.type'
  const measurementsCount = measurementsCountResult.count ?? 0

  return (
    <CustomerConfiguratore
      garmentId={gid}
      tenantSlug={tenantSlug}
      clientId={ctx.clientId}
      clientName={`${client.first_name} ${client.last_name}`}
      garmentName={garment.name ?? 'Nuovo ordine'}
      initialStep={initialStep}
      initialConfig={config}
      measurementsCount={measurementsCount}
      fabrics={(fabrics.data ?? []) as Fabric[]}
      linings={(linings.data ?? []) as Lining[]}
      buttons={(buttons.data ?? []) as ButtonType[]}
      threadColors={(threads.data ?? []) as ThreadColor[]}
      isSubmitted={status === 'submitted'}
    />
  )
}
