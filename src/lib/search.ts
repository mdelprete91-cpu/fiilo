/**
 * Smart search utilities.
 *
 * tokenize: spezza l'input in token, indipendente da accenti/punteggiatura,
 * così "mario del prete" matcha "Del Prete Mario" senza dipendere dall'ordine.
 */

export function tokenize(q: string | null | undefined): string[] {
  if (!q) return []
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 8)
}

/**
 * Costruisce la clausola PostgREST `field.ilike.%t%,...` per UN token su N campi.
 * Va passata a `.or()`. Chiamando `.or()` una volta per token, i gruppi sono
 * AND-ati tra loro: ogni token deve matchare almeno un campo.
 */
export function ilikeOrClause(token: string, fields: string[]): string {
  return fields.map((f) => `${f}.ilike.%${token}%`).join(',')
}

/**
 * Filtro client-side equivalente: il record matcha se ogni token è contenuto
 * in almeno uno dei campi (case-insensitive, accent-insensitive).
 */
export function matchesAllTokens(
  tokens: string[],
  getFields: () => Array<string | null | undefined>,
): boolean {
  if (tokens.length === 0) return true
  const haystack = getFields()
    .filter((v): v is string => !!v)
    .join(' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  return tokens.every((t) => haystack.includes(t))
}
