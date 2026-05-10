// Run with: node --env-file=.env.local scripts/seed-spec-demo.mjs
//
// Inserts catalog items + one fully-configured suit in "in_production" status
// so the Specifica tecnica panel has real data to show.
// Safe to re-run: cleans demo data before re-inserting.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = 'db057da1-b786-410e-8db4-223183a42ab8'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars — run with --env-file=.env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function dateEta(daysFromNow) {
  const d = new Date('2026-05-04')
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

// Demo marker names — used to find and clean previous runs
const DEMO_FABRIC_NAMES  = ['Harrisons Mystique [demo]', 'Caccioppoli Sole [demo]']
const DEMO_LINING_NAMES  = ['Bemberg Bordeaux [demo]']
const DEMO_BUTTON_NAMES  = ['Oscar – Corno naturale [demo]']
const DEMO_THREAD_NAMES  = ['Verde antico [demo]', 'Bianco avorio [demo]']
const DEMO_CLIENT_LNAME  = 'Bianchi-Demo'

async function cleanPrevious() {
  // Client + garments
  const { data: prevClients } = await sb
    .from('clients').select('id').eq('tenant_id', TENANT_ID).eq('last_name', DEMO_CLIENT_LNAME)
  if (prevClients?.length) {
    await sb.from('garments').delete().in('client_id', prevClients.map(c => c.id))
    await sb.from('clients').delete().in('id', prevClients.map(c => c.id))
    console.log('  Removed previous demo client + garments.')
  }

  // Catalog
  await sb.from('fabrics').delete().in('name', DEMO_FABRIC_NAMES).eq('tenant_id', TENANT_ID)
  await sb.from('linings').delete().in('name', DEMO_LINING_NAMES).eq('tenant_id', TENANT_ID)
  await sb.from('buttons').delete().in('name', DEMO_BUTTON_NAMES).eq('tenant_id', TENANT_ID)
  await sb.from('thread_colors').delete().in('name', DEMO_THREAD_NAMES).eq('tenant_id', TENANT_ID)
  console.log('  Removed previous demo catalog items.')
}

async function main() {
  console.log('=== seed-spec-demo ===\n')
  console.log('Cleaning previous demo data...')
  await cleanPrevious()

  // ── Catalog ──────────────────────────────────────────────────────────────────
  console.log('\nInserting catalog...')

  const { data: fabrics, error: fe } = await sb.from('fabrics').insert([
    {
      tenant_id: TENANT_ID,
      name: DEMO_FABRIC_NAMES[0],
      mill: 'Harrisons of Edinburgh',
      code: 'MYS-3412',
      composition: 'Lana 100%',
      weight_grams: 280,
      color: 'Blu notte',
      pattern: 'herringbone',
      is_available: true,
      season: 'autumn_winter',
    },
    {
      tenant_id: TENANT_ID,
      name: DEMO_FABRIC_NAMES[1],
      mill: 'Caccioppoli',
      code: 'CAC-9010',
      composition: 'Lana 100%',
      weight_grams: 220,
      color: 'Grigio perla',
      pattern: 'solid',
      is_available: true,
      season: 'spring_summer',
    },
  ]).select('id, name')

  if (fe) { console.error('fabrics insert failed:', fe); process.exit(1) }

  const { data: linings, error: le } = await sb.from('linings').insert([
    {
      tenant_id: TENANT_ID,
      name: DEMO_LINING_NAMES[0],
      color: 'Bordeaux',
      material: 'Bemberg (cupro)',
      is_available: true,
    },
  ]).select('id, name')

  if (le) { console.error('linings insert failed:', le); process.exit(1) }

  const { data: buttons, error: be } = await sb.from('buttons').insert([
    {
      tenant_id: TENANT_ID,
      name: DEMO_BUTTON_NAMES[0],
      material: 'horn',
      color: 'Naturale',
      finish: 'Lucidato a mano',
      is_available: true,
    },
  ]).select('id, name')

  if (be) { console.error('buttons insert failed:', be); process.exit(1) }

  const { data: threads, error: te } = await sb.from('thread_colors').insert([
    { tenant_id: TENANT_ID, name: DEMO_THREAD_NAMES[0], hex_color: '#4a6741', is_available: true },
    { tenant_id: TENANT_ID, name: DEMO_THREAD_NAMES[1], hex_color: '#f5f0e8', is_available: true },
  ]).select('id, name')

  if (te) { console.error('thread_colors insert failed:', te); process.exit(1) }

  const primaryFabric  = fabrics[0]
  const contrastFabric = fabrics[1]
  const lining         = linings[0]
  const button         = buttons[0]
  const greenThread    = threads[0]
  const ivoThread      = threads[1]

  console.log(`  Tessuto   : ${primaryFabric.name}`)
  console.log(`  Contrasto : ${contrastFabric.name}`)
  console.log(`  Fodera    : ${lining.name}`)
  console.log(`  Bottoni   : ${button.name}`)
  console.log(`  Filo asole: ${greenThread.name} / ${ivoThread.name}`)

  // ── Client ───────────────────────────────────────────────────────────────────
  console.log('\nInserting client...')
  const { data: client, error: ce } = await sb.from('clients').insert({
    tenant_id: TENANT_ID,
    first_name: 'Luca',
    last_name: DEMO_CLIENT_LNAME,
    email: 'luca.bianchi@demo.it',
    phone: '+39 333 9988776',
    city: 'Napoli',
    address: 'Via Chiaia 45',
  }).select('id').single()

  if (ce) { console.error('client insert failed:', ce); process.exit(1) }
  console.log(`  Luca Bianchi-Demo (${client.id})`)

  // ── Configuration JSON ────────────────────────────────────────────────────────
  const configuration = {
    fabric: {
      primaryFabricId: primaryFabric.id,
      contrastFabricId: contrastFabric.id,
    },
    jacket: {
      cut: 'fitted',
      school: 'napoletana',
      breast: 'single',
      singleBreastedButtons: 2,
      doubleBreastedConfig: null,
      shoulder: 'napoletana_camicia',
      sleeve: 'rollino',
      lapelType: 'peak',
      lapelWidth: 'medium',
      lapelWidthCm: 8,
      lapelButtonhole: true,
      stabStitching: false,
      lapelPiping: false,
      hemShape: 'rounded',
      lengthOffset: 1,
      sidePocket: 'flap',
      breastPocket: 'barchetta',
      ticketPocket: true,
      sleeveButtonCount: 4,
      surgeonsCuffs: true,
      kissingButtons: true,
      turnbackCuff: false,
      vent: 'double',
    },
    pant: {
      cut: 'classico',
      waist: 'media',
      suspenderButtons: false,
      pleat: 'single',
      pleatDirection: 'forward',
      sidePocket: 'americana',
      backPocketCount: 2,
      backPocketType: 'jetted',
      backPocketButton: true,
      beltLoops: true,
      sideAdjusters: false,
      beltLoopCount: 5,
      cuff: true,
      cuffHeight: 4,
    },
    vest: {
      breast: 'single',
      lapel: 'notch',
      buttonCount: 6,
      backMaterial: 'satin',
      satinColor: null,
      pocketCount: 4,
      backBelt: true,
    },
    colorContrast: {
      jacketContrastEnabled: true,
      jacketContrastFabricId: contrastFabric.id,
      jacketContrastParts: ['lapels', 'cuffs'],
      pantContrastEnabled: false,
      pantContrastFabricId: null,
      liningType: 'full',
      liningId: lining.id,
      flashLining: true,
      pipingEnabled: false,
      pipingColor: null,
      backCollarContrast: false,
      backCollarColor: null,
      embroideryText: null,
      embroideryThreadColorId: null,
      frontButtonholeThreadId: greenThread.id,
      sleeveButtonholeThreadId: ivoThread.id,
      jacketButtonId: button.id,
      cuffButtonId: button.id,
      frontButtonId: null,
      vestButtonId: button.id,
      monogramEnabled: true,
      monogramText: 'LB',
      monogramThreadColorId: greenThread.id,
      monogramPosition: 'cuff',
    },
    measurementId: null,
  }

  // ── Garment ───────────────────────────────────────────────────────────────────
  console.log('\nInserting garment...')
  const { data: garment, error: ge } = await sb.from('garments').insert({
    tenant_id: TENANT_ID,
    client_id: client.id,
    type: 'suit_3pc',
    name: 'Abito tre pezzi – Demo specifica',
    status: 'in_production',
    total_price: 3800,
    currency: 'EUR',
    delivery_eta: dateEta(18),
    internal_notes: 'Prima prova il 20 maggio. Cliente preferisce spalle morbide.',
    payment_mode: 'deposit',
    payment_status: 'partial',
    configuration,
    current_step: 'review',
  }).select('id').single()

  if (ge) { console.error('garment insert failed:', ge); process.exit(1) }

  console.log(`\n✓ Fatto! Apri la pagina:`)
  console.log(`  /dashboard/produzione/${garment.id}`)
  console.log('\nDone.')
}

main().catch(console.error)
