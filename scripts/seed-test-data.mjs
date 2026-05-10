// Run with: node --env-file=.env.local scripts/seed-test-data.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = 'db057da1-b786-410e-8db4-223183a42ab8'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date('2026-05-04')
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateEta(daysFromNow) {
  const d = new Date('2026-05-04')
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

// ── clients ──────────────────────────────────────────────────────────────────

const CLIENTS = [
  { first_name: 'Marco',      last_name: 'Ferretti',   email: 'marco.ferretti@email.it',    phone: '+39 333 1234567', city: 'Napoli' },
  { first_name: 'Alessandro', last_name: 'Conti',      email: 'a.conti@libero.it',           phone: '+39 347 8901234', city: 'Roma' },
  { first_name: 'Roberto',    last_name: 'Marinelli',  email: null,                           phone: '+39 320 5678901', city: 'Milano' },
  { first_name: 'Francesco',  last_name: 'De Luca',    email: 'fdeluca@gmail.com',           phone: null,              city: 'Napoli' },
  { first_name: 'Giovanni',   last_name: 'Esposito',   email: 'g.esposito@outlook.com',      phone: '+39 366 3456789', city: 'Salerno' },
  { first_name: 'Matteo',     last_name: 'Ricci',      email: null,                           phone: '+39 389 2345678', city: 'Torino' },
  { first_name: 'Stefano',    last_name: 'Lombardi',   email: 'stefano.lombardi@hotmail.it', phone: '+39 340 9012345', city: 'Firenze' },
]

// ── garments (built after client IDs are known) ───────────────────────────────

function buildGarments(clientIds) {
  const [ferretti, conti, marinelli, deLuca, esposito, ricci, lombardi] = clientIds

  return [
    // ── DELIVERED (this month, May 2026) ─────────────────────────────────────
    {
      tenant_id: TENANT_ID, client_id: ferretti,
      type: 'suit_2pc', name: 'Abito matrimonio',
      status: 'delivered', total_price: 3200, currency: 'EUR',
      delivery_eta: '2026-04-28', updated_at: daysAgo(6),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: conti,
      type: 'jacket', name: 'Giacca business',
      status: 'delivered', total_price: 2100, currency: 'EUR',
      delivery_eta: '2026-04-30', updated_at: daysAgo(4),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: marinelli,
      type: 'trousers', name: null,
      status: 'delivered', total_price: 1100, currency: 'EUR',
      delivery_eta: '2026-04-29', updated_at: daysAgo(5),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: esposito,
      type: 'suit_2pc', name: 'Abito cerimonia',
      status: 'delivered', total_price: 2800, currency: 'EUR',
      delivery_eta: '2026-05-01', updated_at: daysAgo(3),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: lombardi,
      type: 'tuxedo', name: 'Smoking gala',
      status: 'delivered', total_price: 3800, currency: 'EUR',
      delivery_eta: '2026-05-02', updated_at: daysAgo(2),
      current_step: 'done',
    },

    // ── READY ────────────────────────────────────────────────────────────────
    {
      tenant_id: TENANT_ID, client_id: deLuca,
      type: 'suit_2pc', name: 'Abito estivo',
      status: 'ready', total_price: 2600, currency: 'EUR',
      delivery_eta: dateEta(2), updated_at: daysAgo(1),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: ricci,
      type: 'jacket', name: null,
      status: 'ready', total_price: 1950, currency: 'EUR',
      delivery_eta: dateEta(5), updated_at: daysAgo(2),
      current_step: 'done',
    },
    {
      tenant_id: TENANT_ID, client_id: ferretti,
      type: 'waistcoat', name: null,
      status: 'ready', total_price: 1200, currency: 'EUR',
      delivery_eta: dateEta(8), updated_at: daysAgo(3),
      current_step: 'done',
    },

    // ── IN PRODUCTION ─────────────────────────────────────────────────────────
    {
      tenant_id: TENANT_ID, client_id: conti,
      type: 'suit_3pc', name: 'Abito tre pezzi',
      status: 'in_production', total_price: 3500, currency: 'EUR',
      delivery_eta: dateEta(14), updated_at: daysAgo(8),
      current_step: 'tailoring',
    },
    {
      tenant_id: TENANT_ID, client_id: marinelli,
      type: 'coat', name: 'Soprabito autunno',
      status: 'in_production', total_price: 2400, currency: 'EUR',
      delivery_eta: dateEta(18), updated_at: daysAgo(5),
      current_step: 'tailoring',
    },
    {
      tenant_id: TENANT_ID, client_id: deLuca,
      type: 'trousers', name: null,
      status: 'in_production', total_price: 950, currency: 'EUR',
      delivery_eta: dateEta(10), updated_at: daysAgo(4),
      current_step: 'cutting',
    },
    {
      tenant_id: TENANT_ID, client_id: esposito,
      type: 'shirt', name: 'Camicia formale',
      status: 'in_production', total_price: 850, currency: 'EUR',
      delivery_eta: dateEta(7), updated_at: daysAgo(3),
      current_step: 'cutting',
    },
    {
      tenant_id: TENANT_ID, client_id: lombardi,
      type: 'jacket', name: 'Giacca casual',
      status: 'in_production', total_price: 1800, currency: 'EUR',
      delivery_eta: dateEta(21), updated_at: daysAgo(6),
      current_step: 'fitting',
    },

    // ── CONFIRMED ─────────────────────────────────────────────────────────────
    {
      tenant_id: TENANT_ID, client_id: ricci,
      type: 'suit_2pc', name: 'Abito laurea',
      status: 'confirmed', total_price: 2900, currency: 'EUR',
      delivery_eta: dateEta(30), updated_at: daysAgo(2),
      current_step: 'confirmed',
    },
    {
      tenant_id: TENANT_ID, client_id: ferretti,
      type: 'tuxedo', name: null,
      status: 'confirmed', total_price: 4200, currency: 'EUR',
      delivery_eta: dateEta(45), updated_at: daysAgo(1),
      current_step: 'confirmed',
    },
    {
      tenant_id: TENANT_ID, client_id: conti,
      type: 'waistcoat', name: null,
      status: 'confirmed', total_price: 1100, currency: 'EUR',
      delivery_eta: dateEta(25), updated_at: daysAgo(1),
      current_step: 'confirmed',
    },
    {
      tenant_id: TENANT_ID, client_id: marinelli,
      type: 'shirt', name: 'Camicia su misura',
      status: 'confirmed', total_price: 880, currency: 'EUR',
      delivery_eta: dateEta(20), updated_at: daysAgo(3),
      current_step: 'confirmed',
    },
  ]
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Checking existing data...')

  const { data: existingClients } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .eq('tenant_id', TENANT_ID)

  if (existingClients && existingClients.length > 0) {
    console.log(`Found ${existingClients.length} existing clients. Clearing old seed data...`)
    const ids = existingClients.map(c => c.id)
    await supabase.from('garments').delete().in('client_id', ids)
    await supabase.from('clients').delete().in('id', ids)
    console.log('Cleared.')
  }

  console.log('Inserting clients...')
  const { data: insertedClients, error: clientErr } = await supabase
    .from('clients')
    .insert(CLIENTS.map(c => ({ ...c, tenant_id: TENANT_ID })))
    .select('id, first_name, last_name')

  if (clientErr) { console.error('Client insert failed:', clientErr); process.exit(1) }
  console.log(`Inserted ${insertedClients.length} clients.`)

  // Map by last name to match our order
  const nameToId = Object.fromEntries(insertedClients.map(c => [c.last_name, c.id]))
  const clientIds = ['Ferretti','Conti','Marinelli','De Luca','Esposito','Ricci','Lombardi'].map(n => nameToId[n])

  console.log('Inserting garments...')
  const garments = buildGarments(clientIds)
  const { data: insertedGarments, error: garmentErr } = await supabase
    .from('garments')
    .insert(garments)
    .select('id, type, status, total_price')

  if (garmentErr) { console.error('Garment insert failed:', garmentErr); process.exit(1) }
  console.log(`Inserted ${insertedGarments.length} garments.`)

  // Summary
  const byStatus = insertedGarments.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1
    return acc
  }, {})
  console.log('\nStatus breakdown:', byStatus)

  const totalRevenue = insertedGarments
    .filter(g => g.status === 'delivered')
    .reduce((s, g) => s + (g.total_price ?? 0), 0)
  console.log(`Fatturato mese (delivered): €${totalRevenue.toLocaleString('it-IT')}`)

  const pipeline = insertedGarments
    .filter(g => ['confirmed','in_production','ready'].includes(g.status))
    .reduce((s, g) => s + (g.total_price ?? 0), 0)
  console.log(`Pipeline (da incassare): €${pipeline.toLocaleString('it-IT')}`)

  console.log('\nDone.')
}

main().catch(console.error)
