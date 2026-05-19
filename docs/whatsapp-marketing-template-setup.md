# WhatsApp Catalog Auto-Push — Setup template Meta

Questa guida descrive come abilitare l'invio automatico di annunci nuovi tessuti
via WhatsApp ai clienti potenzialmente interessati.

L'invio avviene tramite **template messages** (categoria MARKETING) pre-approvati
da Meta. Il template va creato **una sola volta** per ciascun tenant.

## 1 · Crea il template in Meta Business Suite

1. Accedi a [business.facebook.com](https://business.facebook.com) col tuo
   account, seleziona il WhatsApp Business Account collegato al tenant.
2. Apri **WhatsApp Manager → Message Templates → Create Template**.
3. Compila:
   - **Name**: `fabric_announcement_it`
   - **Category**: `MARKETING`
   - **Language**: `Italian (it)`
   - **Header**: `Media → Image`
   - **Body**:
     ```
     Ciao {{1}}, è arrivato un nuovo tessuto che potrebbe piacerti: {{2}}. {{3}} Scrivimi se vuoi vederlo. Rispondi STOP per non ricevere più proposte.
     ```
   - **Footer**: lasciare vuoto (l'opt-out STOP è già nel body)
   - **Sample values** (richiesti da Meta per l'approvazione):
     - `{{1}}` → `Marco`
     - `{{2}}` → `Loro Piana Tasmanian Super 130's`
     - `{{3}}` → `Coordina bene con i tuoi blu navy preferiti.`
   - **Header sample image**: carica una foto reale di tessuto (≥300×300 px,
     JPG/PNG, < 5 MB).
4. **Submit for Review**. Tempo di approvazione: 1-72 ore.

## 2 · Registra il template approvato nel DB

Quando Meta approva il template (lo vedi in WhatsApp Manager → status
`APPROVED`), inserisci la riga in `whatsapp_message_templates`:

```sql
INSERT INTO public.whatsapp_message_templates
  (tenant_id, name, category, language, header_type, body_text, variable_count, status, approved_at)
VALUES (
  '<TENANT_UUID>',
  'fabric_announcement_it',
  'MARKETING',
  'it',
  'IMAGE',
  'Ciao {{1}}, è arrivato un nuovo tessuto che potrebbe piacerti: {{2}}. {{3}} Scrivimi se vuoi vederlo. Rispondi STOP per non ricevere più proposte.',
  3,
  'approved',
  now()
);
```

In alternativa, è disponibile la funzione `recordTemplate()` in
`src/lib/whatsapp/templates.ts` per registrarlo via script.

## 3 · Configura settings marketing del tenant

Cap mensile e flag globale. Idempotente: la riga viene creata automaticamente al
primo invio, ma puoi precrearla:

```sql
INSERT INTO public.tenant_marketing_settings (tenant_id, monthly_cap, marketing_enabled)
VALUES ('<TENANT_UUID>', 50, true)
ON CONFLICT (tenant_id) DO NOTHING;
```

## 4 · Verifica integration WhatsApp

Il tenant deve avere un'integrazione `connected` in `whatsapp_integrations`.
Verificalo da `/dashboard/settings/integrazioni`.

## 5 · Test end-to-end

1. Carica un tessuto con `image_url` valorizzato (foto su Supabase Storage
   pubblico).
2. Vai su `/dashboard/catalogo` e clicca l'icona megafono accanto al tessuto.
3. Clicca **Genera preview** → il sistema esegue il match AI sui clienti.
4. Modifica i messaggi se vuoi, deseleziona chi non vuoi contattare.
5. Clicca **Invia a N** e conferma.

## Edge case / note operative

- I clienti senza preferenze in `client_summaries` non sono mai candidati.
- Soglia minima score: **70/100**. Sotto questa soglia il match è scartato.
- Cooldown anti-spam: massimo 1 messaggio marketing ogni 14 giorni per cliente.
- Cap di default: 50 invii/mese per tenant (modificabile in
  `tenant_marketing_settings.monthly_cap`).
- Opt-out: il cliente può rispondere `STOP`, `BASTA`, `FERMATI`, `CANCELLA` o
  `UNSUBSCRIBE` per disattivare automaticamente le notifiche.
- Costo medio Meta per messaggio marketing IT: ≈ €0.06.
- Il template e l'immagine vengono caricati su Meta una sola volta per invio;
  l'ID immagine è valido ~30 giorni.
