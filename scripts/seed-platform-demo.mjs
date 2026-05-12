// Run with: node --env-file=.env.local scripts/seed-platform-demo.mjs
//
// Crea 12 tenant dummy distribuiti su città italiane per popolare la mappa
// e il chart attivazioni dell'Overview admin (/platform).
//
// Tutti taggati con seed_batch = SEED_BATCH così domani si possono rimuovere
// in massa via POST /api/admin/seed-cleanup { batch: SEED_BATCH }.

import { createClient } from '@supabase/supabase-js'

const SEED_BATCH = 'platform_overview_demo_2026_05_12'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env. Run: node --env-file=.env.local scripts/seed-platform-demo.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── helpers ─────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickCreatedAt() {
  // Distribuzione pesata: cluster recente (più attivazioni nelle ultime settimane)
  const r = Math.random()
  const daysAgo = r < 0.5 ? randInt(0, 29) : r < 0.85 ? randInt(30, 59) : randInt(60, 89)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(randInt(9, 18), randInt(0, 59), 0, 0)
  return d.toISOString()
}

// ── sartorie dummy con coordinate città italiane ────────────────────────────

const SARTORIE = [
  { name: 'Sartoria Albertini',  slug: 'demo-albertini',  city: 'Milano',  lat: 45.4642, lon: 9.1900,  active: true  },
  { name: 'Atelier Rosato',      slug: 'demo-rosato',     city: 'Roma',    lat: 41.9028, lon: 12.4964, active: true  },
  { name: 'Sartoria De Luca',    slug: 'demo-deluca',     city: 'Napoli',  lat: 40.8518, lon: 14.2681, active: true  },
  { name: 'Maison Conti',        slug: 'demo-conti',      city: 'Firenze', lat: 43.7696, lon: 11.2558, active: true  },
  { name: 'Sartoria Borrelli',   slug: 'demo-borrelli',   city: 'Torino',  lat: 45.0703, lon: 7.6869,  active: true  },
  { name: 'Atelier Iervolino',   slug: 'demo-iervolino',  city: 'Bologna', lat: 44.4949, lon: 11.3426, active: true  },
  { name: 'Sartoria Lupo',       slug: 'demo-lupo',       city: 'Palermo', lat: 38.1157, lon: 13.3615, active: true  },
  { name: 'Atelier Russo',       slug: 'demo-russo',      city: 'Bari',    lat: 41.1171, lon: 16.8719, active: true  },
  { name: 'Sartoria Mancini',    slug: 'demo-mancini',    city: 'Genova',  lat: 44.4056, lon: 8.9463,  active: false },
  { name: 'Maison Bellini',      slug: 'demo-bellini',    city: 'Verona',  lat: 45.4384, lon: 10.9916, active: false },
  { name: 'Sartoria Capuano',    slug: 'demo-capuano',    city: 'Catania', lat: 37.5079, lon: 15.0830, active: false },
  { name: 'Atelier Greco',       slug: 'demo-greco',      city: 'Padova',  lat: 45.4064, lon: 11.8768, active: false },
]

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Check duplicati
  const { data: existing } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('seed_batch', SEED_BATCH)
  if (existing && existing.length > 0) {
    console.error(`⚠️  Trovati ${existing.length} tenant già taggati ${SEED_BATCH}.`)
    console.error('   Esegui prima il cleanup endpoint o cambia SEED_BATCH.')
    process.exit(1)
  }

  const rows = SARTORIE.map((s) => {
    const createdAt = pickCreatedAt()
    let lastActive
    if (s.active) {
      // Pulse: attiva nelle ultime 24h
      const d = new Date()
      d.setHours(d.getHours() - randInt(0, 23), randInt(0, 59), 0, 0)
      lastActive = d.toISOString()
    } else {
      // Dimmed: 7-30 giorni fa
      const d = new Date()
      d.setDate(d.getDate() - randInt(7, 30))
      lastActive = d.toISOString()
    }
    return {
      name: s.name,
      slug: s.slug,
      email: `info@${s.slug.replace('demo-', '')}.it`,
      phone: `+39 0${randInt(2, 9)}${randInt(10000000, 99999999)}`,
      address: null,
      city: s.city,
      country: 'IT',
      plan: 'starter',
      is_active: true,
      latitude: s.lat,
      longitude: s.lon,
      last_active_at: lastActive,
      created_at: createdAt,
      updated_at: createdAt,
      seed_batch: SEED_BATCH,
    }
  })

  console.log(`→ Inserting ${rows.length} tenant dummy con batch="${SEED_BATCH}"…`)
  const { data, error } = await supabase.from('tenants').insert(rows).select('id, name, city')
  if (error) {
    console.error('Insert tenants error:', error)
    process.exit(1)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✓ ${data.length} tenant demo inseriti`)
  data.forEach((t) => console.log(`  · ${t.name.padEnd(28)} ${t.city}`))
  console.log('\nPer rimuoverli:')
  console.log(`  POST /api/admin/seed-cleanup { "batch": "${SEED_BATCH}" }`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
