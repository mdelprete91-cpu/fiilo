import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const TYPE_LABEL: Record<string, string> = {
  suit_2pc: 'Abito 2 pezzi',
  suit_3pc: 'Abito 3 pezzi',
  jacket: 'Giacca',
  trousers: 'Pantalone',
  waistcoat: 'Gilet',
  coat: 'Soprabito',
  tuxedo: 'Smoking',
  shirt: 'Camicia',
}

const PAYMENT_MODE_LABEL: Record<string, string> = {
  deposit: 'Acconto + saldo',
  full: 'Pagamento integrale',
  on_delivery: 'Alla consegna',
}

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: { maxWidth: 260 },
  tenantName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  tenantMeta: {
    fontSize: 9,
    color: '#6B6B6B',
    lineHeight: 1.5,
  },
  headerRight: { textAlign: 'right' },
  docLabel: {
    fontSize: 8,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.2,
  },
  docDate: {
    fontSize: 9,
    color: '#6B6B6B',
    marginTop: 4,
  },
  /* Section blocks */
  section: { marginTop: 28 },
  sectionLabel: {
    fontSize: 8,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  /* Cliente + capo two-column */
  twoCol: { flexDirection: 'row', gap: 32 },
  col: { flex: 1 },
  bodyText: { fontSize: 11, lineHeight: 1.45 },
  /* Money table */
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  moneyLabel: { fontSize: 10, color: '#404040' },
  moneyValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  moneyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#111111',
  },
  moneyTotalLabel: {
    fontSize: 10,
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  moneyTotalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  /* Notes */
  notesBox: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#404040',
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5',
  },
  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 56,
    right: 56,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    fontSize: 8,
    color: '#9C9C9C',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export interface PreventivoData {
  tenant: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
  }
  client: {
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    city: string | null
  }
  garment: {
    id: string
    name: string | null
    type: string
    total_price: number | null
    currency: string
    deposit_amount: number | null
    payment_mode: string | null
    delivery_eta: string | null
    internal_notes: string | null
    created_at: string
  }
}

function fmtCurrency(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function PreventivoDocument({ tenant, client, garment }: PreventivoData) {
  const total = garment.total_price ?? 0
  const deposit = garment.deposit_amount ?? 0
  const balance = Math.max(0, total - deposit)
  const tenantLines = [
    tenant.address,
    [tenant.city].filter(Boolean).join(''),
    tenant.email,
    tenant.phone,
  ].filter(Boolean)

  return (
    <Document
      title={`Preventivo ${shortId(garment.id)} – ${client.last_name}`}
      author={tenant.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.tenantName}>{tenant.name}</Text>
            {tenantLines.map((line, i) => (
              <Text key={i} style={styles.tenantMeta}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>Preventivo</Text>
            <Text style={styles.docNumber}>N. {shortId(garment.id)}</Text>
            <Text style={styles.docDate}>{fmtDate(garment.created_at)}</Text>
          </View>
        </View>

        {/* Cliente + Capo */}
        <View style={styles.section}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionLabel}>Cliente</Text>
              <Text style={styles.bodyText}>
                {client.last_name} {client.first_name}
              </Text>
              {client.email && (
                <Text style={[styles.bodyText, { color: '#6B6B6B' }]}>
                  {client.email}
                </Text>
              )}
              {client.phone && (
                <Text style={[styles.bodyText, { color: '#6B6B6B' }]}>
                  {client.phone}
                </Text>
              )}
              {client.city && (
                <Text style={[styles.bodyText, { color: '#6B6B6B' }]}>
                  {client.city}
                </Text>
              )}
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionLabel}>Capo</Text>
              <Text style={styles.bodyText}>
                {TYPE_LABEL[garment.type] ?? garment.type}
              </Text>
              {garment.name && (
                <Text style={[styles.bodyText, { color: '#6B6B6B' }]}>
                  {garment.name}
                </Text>
              )}
              <Text style={[styles.bodyText, { color: '#6B6B6B', marginTop: 4 }]}>
                Consegna prevista: {fmtDate(garment.delivery_eta)}
              </Text>
            </View>
          </View>
        </View>

        {/* Money */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Importi</Text>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Imponibile</Text>
            <Text style={styles.moneyValue}>{fmtCurrency(total, garment.currency)}</Text>
          </View>
          {garment.payment_mode && (
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Modalità di pagamento</Text>
              <Text style={styles.moneyValue}>
                {PAYMENT_MODE_LABEL[garment.payment_mode] ?? garment.payment_mode}
              </Text>
            </View>
          )}
          {deposit > 0 && (
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Acconto previsto</Text>
              <Text style={styles.moneyValue}>{fmtCurrency(deposit, garment.currency)}</Text>
            </View>
          )}
          <View style={styles.moneyTotalRow}>
            <Text style={styles.moneyTotalLabel}>
              {deposit > 0 ? 'Saldo a consegna' : 'Totale a consegna'}
            </Text>
            <Text style={styles.moneyTotalValue}>
              {fmtCurrency(deposit > 0 ? balance : total, garment.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {garment.internal_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Note</Text>
            <Text style={styles.notesBox}>{garment.internal_notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {tenant.name}
            {tenant.city ? ` · ${tenant.city}` : ''}
          </Text>
          <Text>Preventivo non fiscale · Valido 30 giorni</Text>
        </View>
      </Page>
    </Document>
  )
}
