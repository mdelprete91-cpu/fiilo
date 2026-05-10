import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { FabricsTable } from '@/components/catalogo/FabricsTable'
import { LiningsTable } from '@/components/catalogo/LiningsTable'
import { ButtonsTable } from '@/components/catalogo/ButtonsTable'
import { ThreadColorsTable } from '@/components/catalogo/ThreadColorsTable'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { id: 'tessuti', label: 'Tessuti' },
  { id: 'fodere', label: 'Fodere' },
  { id: 'bottoni', label: 'Bottoni' },
  { id: 'fili', label: 'Colori filo' },
] as const

type TabId = (typeof TABS)[number]['id']

export default async function CatalogoPage({ searchParams }: PageProps) {
  const session = await requireRole(['tenant_admin', 'tenant_staff'])
  const { tab } = await searchParams
  const activeTab: TabId = (TABS.find((t) => t.id === tab)?.id) ?? 'tessuti'
  const supabase = await createClient()
  const tid = session.tenantId!

  const [fabrics, linings, buttons, threads] = await Promise.all([
    supabase.from('fabrics').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('linings').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('buttons').select('*').eq('tenant_id', tid).order('name'),
    supabase.from('thread_colors').select('*').eq('tenant_id', tid).order('name'),
  ])

  return (
    <div className="min-h-full bg-background px-6 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <TopBar role={session.role} userName={session.fullName ?? session.email} />
        <h1 className="font-heading text-5xl text-ink leading-none">Catalogo</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`/dashboard/catalogo?tab=${t.id}`}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Contenuto tab */}
      {activeTab === 'tessuti' && (
        <FabricsTable fabrics={fabrics.data ?? []} />
      )}
      {activeTab === 'fodere' && (
        <LiningsTable linings={linings.data ?? []} />
      )}
      {activeTab === 'bottoni' && (
        <ButtonsTable buttons={buttons.data ?? []} />
      )}
      {activeTab === 'fili' && (
        <ThreadColorsTable colors={threads.data ?? []} />
      )}
    </div>
  )
}
