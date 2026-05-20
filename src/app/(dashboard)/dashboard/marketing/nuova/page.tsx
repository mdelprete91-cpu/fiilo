import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BackButton } from '@/components/dashboard/BackButton'
import { NewCampaignForm } from '@/components/marketing/NewCampaignForm'

export default async function NuovaCampagnaPage() {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const supabase = await createClient()
  const tid = session.tenantId!

  const { data: fabrics } = await supabase
    .from('fabrics')
    .select('id, name, mill, color, season')
    .eq('tenant_id', tid)
    .eq('is_available', true)
    .order('name', { ascending: true })
    .limit(200)

  // Templates di sistema + custom del tenant. RLS già filtra correttamente.
  // src/types/database.ts non contiene la tabella newsletter_templates:
  // cast esplicito via 'as never'.
  const tplRes = await supabase
    .from('newsletter_templates' as never)
    .select(
      'id, slug, name, occasion, description, is_system, subject_template, incipit_template, gancio_template, chiusura_template, cta_label',
    )
    .order('sort_order' as never, { ascending: true })

  // Se la migration 024 non è applicata, tplRes.error sarà PGRST205: fallback [].
  type TemplateRow = {
    id: string
    slug: string
    name: string
    occasion: 'new_fabric' | 'seasonal' | 'event' | 'custom'
    description: string | null
    is_system: boolean
    subject_template: string
    incipit_template: string
    gancio_template: string
    chiusura_template: string
    cta_label: string | null
  }
  const templates: TemplateRow[] = tplRes.error
    ? []
    : ((tplRes.data ?? []) as unknown as TemplateRow[])

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <div className="flex-1">
          <BackButton fallbackHref="/dashboard/marketing" label="Comunicazioni" />
          <h1 className="mt-2 font-heading text-4xl text-ink leading-none">
            Nuova comunicazione
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scegli un template, l'occasione e (se vuoi) un tessuto in evidenza.
            filo invierà la newsletter a tutti i tuoi clienti iscritti.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <NewCampaignForm fabrics={fabrics ?? []} templates={templates} />
      </div>
    </div>
  )
}
