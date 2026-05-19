import { requireCustomerContext } from '@/lib/auth/customer-guard'
import { createClient } from '@/lib/supabase/server'
import { FabricCatalog } from '@/components/customer/FabricCatalog'
import type { Fabric } from '@/types/database'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function CustomerCatalogPage({ params }: PageProps) {
  const { tenantSlug } = await params
  const ctx = await requireCustomerContext(tenantSlug)
  const supabase = await createClient()

  const { data: fabrics } = await supabase
    .from('fabrics')
    .select('*')
    .eq('tenant_id', ctx.tenant.id)
    .eq('is_available', true)
    .order('name')

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-6">
      <section className="space-y-1.5">
        <h1 className="font-heading text-3xl text-ink md:text-4xl">Catalogo tessuti</h1>
        <p className="text-sm text-muted-foreground">
          Sfoglia i tessuti disponibili in sartoria.
        </p>
      </section>

      <FabricCatalog
        fabrics={(fabrics ?? []) as Fabric[]}
        showPrices={ctx.tenant.show_prices_to_customers}
      />
    </div>
  )
}
