/**
 * Normalizes a phone number to E.164 digits-only format for matching.
 * "+39 333 1234567" → "393331234567"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Returns true if two phone numbers refer to the same number,
 * comparing only the last 9 digits to handle country-code variations.
 */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  if (!na || !nb) return false
  const tail = Math.min(9, na.length, nb.length)
  return na.slice(-tail) === nb.slice(-tail)
}
