-- ============================================================
-- 024 — Newsletter templates (system + per-tenant, no-AI path)
-- ============================================================
-- Permette al sarto di scegliere un template pre-fatto invece di
-- generare l'email con Claude. Variabili sostituite via simple text
-- replace (lib/newsletter/substitute.ts).
--
-- 4 template "di sistema" (tenant_id NULL) inseriti subito.
-- ============================================================

CREATE TABLE public.newsletter_templates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug               TEXT NOT NULL,
  name               TEXT NOT NULL,
  occasion           newsletter_occasion NOT NULL,
  description        TEXT,
  subject_template   TEXT NOT NULL,
  incipit_template   TEXT NOT NULL,
  gancio_template    TEXT NOT NULL,
  chiusura_template  TEXT NOT NULL,
  cta_label          TEXT,
  cta_url_template   TEXT,
  is_system          BOOLEAN NOT NULL DEFAULT false,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_templates_tenant ON public.newsletter_templates(tenant_id);
CREATE INDEX idx_newsletter_templates_occasion ON public.newsletter_templates(occasion);

-- I template di sistema sono visibili a tutti i tenant (tenant_id IS NULL).
-- Quelli custom sono ristretti al proprio tenant.
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates: select system or own"
  ON public.newsletter_templates FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = public.my_tenant_id());

CREATE POLICY "templates: insert own (no system)"
  ON public.newsletter_templates FOR INSERT
  WITH CHECK (tenant_id = public.my_tenant_id() AND is_system = false);

CREATE POLICY "templates: update own (no system)"
  ON public.newsletter_templates FOR UPDATE
  USING (tenant_id = public.my_tenant_id() AND is_system = false)
  WITH CHECK (tenant_id = public.my_tenant_id() AND is_system = false);

CREATE POLICY "templates: delete own (no system)"
  ON public.newsletter_templates FOR DELETE
  USING (tenant_id = public.my_tenant_id() AND is_system = false);

-- ── Campaign: link a template + toggle AI ────────────────────
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.newsletter_templates(id),
  ADD COLUMN IF NOT EXISTS use_ai BOOLEAN NOT NULL DEFAULT false;

-- ── Seed: 4 template di sistema ──────────────────────────────

INSERT INTO public.newsletter_templates
  (tenant_id, slug, name, occasion, description, is_system, sort_order,
   subject_template, incipit_template, gancio_template, chiusura_template,
   cta_label, cta_url_template)
VALUES
  (
    NULL,
    'new_fabric',
    'Nuovo tessuto in atelier',
    'new_fabric',
    'Annuncio l''arrivo di un tessuto, con foto e CTA WhatsApp.',
    true,
    10,
    'Un tessuto che potrebbe piacerti, {{client_first_name}}',
    'Caro {{client_first_name}}, oggi ti scrivo per condividere una novità del nostro atelier.',
    'È appena arrivato {{fabric_name}}{{fabric_mill_suffix}}, un tessuto pensato per la stagione che potrebbe stare bene addosso a te. Se ti incuriosisce, vieni a vederlo o scrivimi e ti racconto di più.',
    'A presto, {{tenant_name}}',
    'Scrivimi su WhatsApp',
    '{{whatsapp_url}}'
  ),
  (
    NULL,
    'seasonal_greeting',
    'Saluto di stagione',
    'seasonal',
    'Un promemoria stagionale, senza fretta. Invita a una visita.',
    true,
    20,
    'Un saluto da {{tenant_name}}',
    'Caro {{client_first_name}}, è ufficialmente {{current_season}}: ti scrivo per salutarti.',
    'Nei prossimi giorni l''atelier si riempirà di tessuti pensati per la stagione. Se hai un''occasione importante in vista, fammi sapere quando passare a dare un''occhiata.',
    'Un abbraccio, {{tenant_name}}',
    'Prenota una visita',
    '{{whatsapp_url}}'
  ),
  (
    NULL,
    'event_announcement',
    'Evento in atelier',
    'event',
    'Inviti a un evento speciale (open day, presentazione, ricorrenza).',
    true,
    30,
    'Un evento in atelier',
    'Caro {{client_first_name}}, ti scrivo per invitarti a un evento speciale del nostro atelier.',
    'Sarò felice di averti tra noi: passa quando puoi, anche solo per un caffè e per vedere le novità della collezione.',
    'A presto, {{tenant_name}}',
    'Conferma su WhatsApp',
    '{{whatsapp_url}}'
  ),
  (
    NULL,
    'birthday_wishes',
    'Auguri di compleanno',
    'custom',
    'Un breve messaggio di auguri personale, con accoglienza in atelier.',
    true,
    40,
    'Tanti auguri, {{client_first_name}}!',
    'Caro {{client_first_name}}, oggi è una giornata speciale: tanti auguri da tutta {{tenant_name}}.',
    'Spero che sia una giornata bellissima. Se passi in atelier ti aspetta sempre un''accoglienza speciale.',
    'Un abbraccio, {{tenant_name}}',
    NULL,
    NULL
  );
