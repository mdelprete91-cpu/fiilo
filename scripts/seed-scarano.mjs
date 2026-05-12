// Run with: node --env-file=.env.local scripts/seed-scarano.mjs
//
// Popola la sartoria Scarano con ~120 clienti, ~40 garment in stati misti,
// ~15 messaggi WhatsApp inbound, tutti con date distribuite sugli ultimi 90gg
// con cluster crescente verso il presente.
//
// IMPORTANTE: i record creati QUI non sono taggati con seed_batch
// (utente li considera dati test permanenti). Per rimuoverli serve query manuale
// per range di created_at o per nome cliente.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env. Run: node --env-file=.env.local scripts/seed-scarano.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── helpers ─────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function chunks(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Distribuzione pesata verso il presente: 50% ultimi 30gg, 30% 30-60gg, 20% 60-90gg.
function pickDateLast90Days() {
  const r = Math.random()
  const daysAgo = r < 0.5 ? randInt(0, 29) : r < 0.8 ? randInt(30, 59) : randInt(60, 89)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(8, 19), randInt(0, 59), randInt(0, 59), 0)
  return d.toISOString()
}

function pickDateLast14Days() {
  const daysAgo = randInt(0, 13)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(8, 21), randInt(0, 59), 0, 0)
  return d.toISOString()
}

function pickEtaDate(weeksFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + weeksFromNow * 7 + randInt(-3, 3))
  return d.toISOString().slice(0, 10)
}

// ── nomi italiani realistici ────────────────────────────────────────────────

const FIRST_NAMES_M = [
  'Marco', 'Luca', 'Giuseppe', 'Antonio', 'Francesco', 'Andrea', 'Matteo',
  'Davide', 'Alessandro', 'Lorenzo', 'Giovanni', 'Stefano', 'Roberto', 'Paolo',
  'Federico', 'Riccardo', 'Tommaso', 'Edoardo', 'Simone', 'Daniele', 'Gabriele',
  'Salvatore', 'Vincenzo', 'Pietro', 'Carlo', 'Maurizio', 'Fabio', 'Massimo',
]
const FIRST_NAMES_F = [
  'Giulia', 'Sofia', 'Martina', 'Chiara', 'Alessia', 'Francesca', 'Sara',
  'Elena', 'Anna', 'Laura', 'Valentina', 'Giorgia', 'Beatrice', 'Camilla',
  'Federica', 'Silvia', 'Cristina', 'Paola', 'Roberta', 'Eleonora', 'Maria',
  'Lucia', 'Caterina', 'Elisa', 'Veronica',
]
const LAST_NAMES = [
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo',
  'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini',
  'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana',
  'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini',
  'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra',
  'Coppola', 'De Santis', 'D\'Angelo', 'Marchetti', 'Parisi', 'Villa',
  'Conte', 'Ferrari', 'Bianco', 'Fiore', 'Battaglia', 'Sala',
]
const CITIES = [
  'Napoli', 'Roma', 'Milano', 'Bologna', 'Firenze', 'Torino', 'Bari',
  'Palermo', 'Catania', 'Genova', 'Verona', 'Padova', 'Salerno', 'Caserta',
  'Brescia', 'Modena', 'Parma', 'Bergamo',
]
const STREETS = [
  'Via Roma', 'Via Garibaldi', 'Via Mazzini', 'Via Dante', 'Via Verdi',
  'Corso Italia', 'Corso Vittorio Emanuele', 'Piazza del Popolo',
  'Via Cavour', 'Via Manzoni', 'Via XX Settembre', 'Via dei Mille',
  'Largo Magellano', 'Via San Carlo', 'Via Toledo',
]
const MOBILE_PREFIXES = [
  '320', '327', '328', '329', '333', '334', '335', '336', '337', '338',
  '339', '340', '343', '346', '347', '348', '349', '366', '388', '389', '393',
]
const EMAIL_DOMAINS = ['gmail.com', 'libero.it', 'hotmail.it', 'outlook.com', 'icloud.com', 'tiscali.it', 'virgilio.it']

function genPhone() {
  const prefix = pick(MOBILE_PREFIXES)
  const rest = String(randInt(1000000, 9999999))
  return `+39 ${prefix} ${rest.slice(0, 3)}${rest.slice(3)}`
}

function slugify(name) {
  return name.toLowerCase().replace(/['\s]+/g, '.').replace(/[^a-z.]/g, '')
}

function genEmail(first, last) {
  const s = `${slugify(first)}.${slugify(last)}`
  return `${s}@${pick(EMAIL_DOMAINS)}`
}

function genAddress(city) {
  return `${pick(STREETS)} ${randInt(1, 180)}, ${city}`
}

// ── catalogo capi (per garment realistici) ──────────────────────────────────

const GARMENT_OCCASIONS = [
  { type: 'suit_2pc', name: 'Abito da matrimonio',          price: [1800, 3200] },
  { type: 'suit_2pc', name: 'Abito da cerimonia',           price: [1600, 2800] },
  { type: 'suit_3pc', name: 'Abito tre pezzi grigio',       price: [2200, 3800] },
  { type: 'tuxedo',   name: 'Smoking nero',                 price: [2400, 4200] },
  { type: 'jacket',   name: 'Giacca destrutturata',         price: [900,  1600] },
  { type: 'jacket',   name: 'Blazer doppiopetto',           price: [1100, 1900] },
  { type: 'coat',     name: 'Cappotto invernale',           price: [1400, 2400] },
  { type: 'coat',     name: 'Soprabito mezza stagione',     price: [1200, 2000] },
  { type: 'trousers', name: 'Pantalone classico',           price: [380,  680] },
  { type: 'shirt',    name: 'Camicia su misura',            price: [180,  320] },
  { type: 'waistcoat',name: 'Gilet abbinato',               price: [320,  560] },
]

// status mix: 8 draft, 10 confirmed, 12 in_production, 6 ready, 4 delivered
const GARMENT_STATUS_POOL = [
  ...Array(8).fill('draft'),
  ...Array(10).fill('confirmed'),
  ...Array(12).fill('in_production'),
  ...Array(6).fill('ready'),
  ...Array(4).fill('delivered'),
]

// ── messaggi WhatsApp realistici (testuali) ─────────────────────────────────

const WA_TEMPLATES = [
  { type: 'text',  body: 'Buongiorno, ho ricevuto il preventivo, possiamo confermare?', cat: 'approvazione' },
  { type: 'text',  body: 'Quando posso passare per la prima prova?', cat: 'richiesta' },
  { type: 'text',  body: 'Vorrei stringere un filo la giacca sulle spalle.', cat: 'richiesta' },
  { type: 'text',  body: 'Per i bottoni preferisco corno scuro, non plastica.', cat: 'riferimento_dettaglio' },
  { type: 'text',  body: 'Ho misurato la vita: 92cm, spalle 48cm.', cat: 'misura' },
  { type: 'text',  body: 'Mi piacerebbe un revers a punta, doppiopetto.', cat: 'riferimento_dettaglio' },
  { type: 'text',  body: 'Tutto perfetto, grazie!', cat: 'approvazione' },
  { type: 'text',  body: 'Foto di ispirazione che ti mando dopo.', cat: 'ispirazione' },
  { type: 'text',  body: 'È pronto per la consegna?', cat: 'richiesta' },
  { type: 'text',  body: 'Confermo tutto, andiamo in produzione.', cat: 'approvazione' },
  { type: 'image', body: null, cat: 'ispirazione', summary: 'Foto giacca ispirazione' },
  { type: 'image', body: null, cat: 'riferimento_dettaglio', summary: 'Dettaglio bottoni' },
  { type: 'audio', body: 'Ciao, volevo dirti che ho cambiato idea sulla fodera, preferirei quella rossa che mi hai mostrato la settimana scorsa.', cat: 'richiesta' },
  { type: 'audio', body: 'Buongiorno, la mia vita è 88cm e le spalle 46cm, te lo dico per il completo blu.', cat: 'misura' },
  { type: 'text',  body: 'Grazie mille, le misure sono perfette.', cat: 'approvazione' },
]

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Trova Scarano
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, name')
    .ilike('name', '%scarano%')
    .limit(2)
  if (tErr) throw tErr
  if (!tenants || tenants.length === 0) {
    console.error('❌ Tenant Scarano non trovato. Crealo prima dall\'UI.')
    process.exit(1)
  }
  if (tenants.length > 1) {
    console.error('⚠️  Trovati più tenant Scarano:', tenants.map((t) => t.name).join(', '))
    process.exit(1)
  }
  const tenant = tenants[0]
  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Genera 120 clienti
  const usedPhones = new Set()
  const clients = []
  for (let i = 0; i < 120; i++) {
    const isMale = Math.random() < 0.78  // sartoria su misura, prevalentemente clientela maschile
    const firstName = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F)
    const lastName = pick(LAST_NAMES)
    const city = pick(CITIES)
    const hasEmail = Math.random() < 0.6
    let phone
    do { phone = genPhone() } while (usedPhones.has(phone))
    usedPhones.add(phone)
    const created = pickDateLast90Days()

    clients.push({
      tenant_id: tenant.id,
      first_name: firstName,
      last_name: lastName,
      email: hasEmail ? genEmail(firstName, lastName) : null,
      phone,
      address: Math.random() < 0.7 ? genAddress(city) : null,
      city,
      country: 'IT',
      created_at: created,
      updated_at: created,
    })
  }

  // Insert clients in chunks
  console.log(`→ Inserting ${clients.length} clients…`)
  const insertedClientIds = []
  for (const chunk of chunks(clients, 50)) {
    const { data, error } = await supabase.from('clients').insert(chunk).select('id, created_at')
    if (error) {
      console.error('Insert clients error:', error)
      process.exit(1)
    }
    insertedClientIds.push(...data)
  }
  console.log(`✓ ${insertedClientIds.length} clienti inseriti`)

  // 3. Garment: 40 distribuiti su ~30 clienti random (alcuni con 2)
  const garmentCount = 40
  const garmentClients = []
  // Pick ~30 unique clients, then 10 of them get a second garment
  const shuffled = [...insertedClientIds].sort(() => Math.random() - 0.5)
  for (let i = 0; i < garmentCount; i++) {
    garmentClients.push(shuffled[i % shuffled.length])
  }

  const garments = garmentClients.map((client, i) => {
    const occ = pick(GARMENT_OCCASIONS)
    const status = GARMENT_STATUS_POOL[i] ?? 'draft'
    const created = pickDateLast90Days()
    const price = randInt(occ.price[0], occ.price[1])
    // ETA: per status delivered/ready nel passato/presente, altrimenti futuro
    let eta = null
    if (status === 'delivered') eta = pickEtaDate(-2)
    else if (status === 'ready') eta = pickEtaDate(0)
    else if (status === 'in_production') eta = pickEtaDate(3)
    else if (status === 'confirmed') eta = pickEtaDate(6)
    else if (status === 'draft' && Math.random() < 0.4) eta = pickEtaDate(8)

    return {
      tenant_id: tenant.id,
      client_id: client.id,
      type: occ.type,
      name: occ.name,
      status,
      total_price: price,
      currency: 'EUR',
      delivery_eta: eta,
      created_at: created,
      updated_at: created,
    }
  })

  console.log(`→ Inserting ${garments.length} garments…`)
  for (const chunk of chunks(garments, 50)) {
    const { error } = await supabase.from('garments').insert(chunk)
    if (error) {
      console.error('Insert garments error:', error)
      process.exit(1)
    }
  }
  console.log(`✓ ${garments.length} garment inseriti`)

  // 4. WhatsApp: 15 messaggi inbound linkati a 10 clienti random
  const waClientPool = shuffled.slice(0, 10)
  const waMessages = WA_TEMPLATES.map((tpl, i) => {
    const client = waClientPool[i % waClientPool.length]
    const sent = pickDateLast14Days()
    const phone = `+39${String(randInt(3000000000, 3999999999))}`
    return {
      tenant_id: tenant.id,
      client_id: client.id,
      wa_message_id: `seed_scarano_${Date.now()}_${i}`,
      wa_phone_number_id: 'seed',
      from_phone: phone,
      from_name: null,
      message_type: tpl.type,
      body: tpl.body,
      category: tpl.cat,
      category_summary: tpl.summary ?? null,
      is_read: Math.random() < 0.3,
      sent_at: sent,
      created_at: sent,
    }
  })

  console.log(`→ Inserting ${waMessages.length} WhatsApp messages…`)
  const { error: waErr } = await supabase.from('whatsapp_messages').insert(waMessages)
  if (waErr) {
    console.error('Insert WA error:', waErr)
    process.exit(1)
  }
  console.log(`✓ ${waMessages.length} messaggi WhatsApp inseriti`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✓ Seed completato per ${tenant.name}`)
  console.log(`  • ${clients.length} clienti`)
  console.log(`  • ${garments.length} garment`)
  console.log(`  • ${waMessages.length} messaggi WhatsApp`)
  console.log(`  NOTE: nessun seed_batch tag — rimozione manuale solo per range date.`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
