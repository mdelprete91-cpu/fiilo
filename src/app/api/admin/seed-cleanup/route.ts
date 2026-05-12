import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/seed-cleanup
 *
 * Rimuove tutti i record taggati con un dato `seed_batch` da
 * whatsapp_messages, garments, clients, tenants (in ordine FK-safe).
 *
 * Body: { "batch": "platform_overview_demo_2026_05_12", "dry_run"?: true }
 *
 * Auth: solo platform_owner.
 * Sicurezza: refuse vuoto/null/wildcard. Bypass RLS via service role.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }
  if (session.role !== 'platform_owner') {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  let payload: { batch?: unknown; dry_run?: unknown }
  try {
    payload = (await req.json()) as { batch?: unknown; dry_run?: unknown }
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const batch = typeof payload.batch === 'string' ? payload.batch.trim() : ''
  if (!batch) {
    return NextResponse.json(
      { error: 'Campo "batch" obbligatorio (stringa non vuota)' },
      { status: 400 },
    )
  }
  if (batch === '*' || batch === '%') {
    return NextResponse.json(
      { error: 'Wildcard non ammessi' },
      { status: 400 },
    )
  }
  const dryRun = payload.dry_run === true

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Conteggio (sempre, per audit)
  const tables = ['whatsapp_messages', 'garments', 'clients', 'tenants'] as const
  const counts: Record<string, number> = {}
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('seed_batch', batch)
    if (error) {
      return NextResponse.json(
        { error: `Count failed on ${table}: ${error.message}` },
        { status: 500 },
      )
    }
    counts[table] = count ?? 0
  }

  if (dryRun) {
    return NextResponse.json({ dry_run: true, batch, counts })
  }

  // Delete FK-safe: WA → garment → client → tenant
  const deleted: Record<string, number> = {}
  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .eq('seed_batch', batch)
    if (error) {
      return NextResponse.json(
        { error: `Delete failed on ${table}: ${error.message}`, partial: deleted },
        { status: 500 },
      )
    }
    deleted[table] = count ?? 0
  }

  return NextResponse.json({ dry_run: false, batch, deleted })
}
