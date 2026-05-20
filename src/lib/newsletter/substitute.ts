/**
 * Variable substitution per template newsletter (path no-AI).
 *
 * Sostituisce {{var_name}} con il valore in `vars`. Se una variabile
 * non è definita, lascia il placeholder così com'è (utile in preview).
 *
 * Variabili supportate (vedi buildTemplateVars):
 *   - client_first_name, client_last_name, client_full_name
 *   - tenant_name, whatsapp_url
 *   - fabric_name, fabric_mill, fabric_mill_suffix, fabric_season,
 *     fabric_season_label, fabric_external_url
 *   - fabric_external_url_or_whatsapp (derivata: external_url o whatsapp_url)
 *   - current_season (primavera/estate/autunno/inverno)
 *   - current_month_it
 */

export type TemplateVars = Record<string, string>

export function substituteTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, key) => {
    const v = vars[key]
    return v != null ? v : `{{${key}}}`
  })
}

interface ClientInput {
  first_name: string
  last_name: string | null
}

interface TenantInput {
  name: string
  phone?: string | null
}

interface FabricInput {
  name: string
  mill: string | null
  season: string | null
  external_url?: string | null
}

export function buildTemplateVars(opts: {
  client: ClientInput
  tenant: TenantInput
  fabric: FabricInput | null
  now?: Date
}): TemplateVars {
  const { client, tenant, fabric, now = new Date() } = opts

  const firstName = client.first_name.trim() || 'cliente'
  const lastName = (client.last_name ?? '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  const phone = (tenant.phone ?? '').replace(/[^0-9+]/g, '')
  const whatsappUrl = phone
    ? `https://wa.me/${phone.replace(/^\+/, '')}`
    : ''

  const month = now.getMonth() + 1 // 1-12
  const season =
    month >= 3 && month <= 5 ? 'primavera'
    : month >= 6 && month <= 8 ? 'estate'
    : month >= 9 && month <= 11 ? 'autunno'
    : 'inverno'

  const monthsIt = [
    'gennaio','febbraio','marzo','aprile','maggio','giugno',
    'luglio','agosto','settembre','ottobre','novembre','dicembre',
  ] as const
  const monthLabelIt = monthsIt[now.getMonth()] ?? ''

  const vars: TemplateVars = {
    client_first_name: firstName,
    client_last_name: lastName,
    client_full_name: fullName,
    tenant_name: tenant.name,
    whatsapp_url: whatsappUrl,
    current_season: season,
    current_month_it: monthLabelIt,
  }

  if (fabric) {
    vars.fabric_name = fabric.name
    vars.fabric_mill = fabric.mill ?? ''
    vars.fabric_mill_suffix = fabric.mill ? ` di ${fabric.mill}` : ''
    vars.fabric_season = fabric.season ?? ''
    vars.fabric_season_label = fabric.season
      ? (
        fabric.season === 'spring' ? 'primavera'
        : fabric.season === 'summer' ? 'estate'
        : fabric.season === 'autumn' || fabric.season === 'fall' ? 'autunno'
        : fabric.season === 'winter' ? 'inverno'
        : fabric.season === 'spring_summer' ? 'primavera/estate'
        : fabric.season === 'autumn_winter' ? 'autunno/inverno'
        : fabric.season === 'all_seasons' ? 'tutto l\'anno'
        : fabric.season
      )
      : ''
  } else {
    vars.fabric_name = ''
    vars.fabric_mill = ''
    vars.fabric_mill_suffix = ''
    vars.fabric_season = ''
    vars.fabric_season_label = ''
  }

  return vars
}
