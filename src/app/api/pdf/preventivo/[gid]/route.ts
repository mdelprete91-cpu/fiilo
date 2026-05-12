import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PreventivoDocument } from '@/lib/pdf/Preventivo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gid: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (!['tenant_admin', 'tenant_staff'].includes(session.role)) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }
  const { gid } = await params
  const supabase = await createClient()
  const tid = session.tenantId!

  const [
    { data: garment, error: garmentErr },
    { data: tenant, error: tenantErr },
  ] = await Promise.all([
    supabase
      .from('garments')
      .select(
        'id, name, type, total_price, currency, deposit_amount, payment_mode, delivery_eta, internal_notes, created_at, client_id',
      )
      .eq('id', gid)
      .eq('tenant_id', tid)
      .single(),
    supabase
      .from('tenants')
      .select('name, email, phone, address, city')
      .eq('id', tid)
      .single(),
  ])

  if (garmentErr || !garment) {
    return NextResponse.json({ error: 'Garment non trovato' }, { status: 404 })
  }
  if (tenantErr || !tenant) {
    return NextResponse.json({ error: 'Sartoria non trovata' }, { status: 404 })
  }

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('first_name, last_name, email, phone, city')
    .eq('id', garment.client_id)
    .eq('tenant_id', tid)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    PreventivoDocument({ tenant, client, garment }),
  )

  const filename = `preventivo-${client.last_name.toLowerCase()}-${garment.id.slice(0, 8)}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
