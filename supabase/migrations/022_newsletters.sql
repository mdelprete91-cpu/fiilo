-- ============================================================
-- 022 — Newsletter AI personalizzate (email-only MVP)
-- ============================================================
-- Tre tabelle:
--   newsletter_preferences — opt-in per cliente (email/whatsapp) + token unsub
--   newsletter_campaigns   — campagne create dal sarto (occasion + tessuto evidenza)
--   newsletter_recipients  — riga per (campagna, cliente) con copy personalizzata
--
-- DIPENDENZA ESTERNA: la colonna `clients.marketing_optout` è prodotta dalla
-- migration 023 (agente WhatsApp Catalog Push). Il codice applicativo del
-- modulo newsletter la legge ma non la crea, perciò la 023 deve essere
-- applicata PRIMA di andare in produzione con questa feature.
-- ============================================================

-- ── Tabella 1: preferenze newsletter ──────────────────────────
CREATE TABLE public.newsletter_preferences (
  client_id          UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id          UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email_opted_in     BOOLEAN NOT NULL DEFAULT false,
  whatsapp_opted_in  BOOLEAN NOT NULL DEFAULT false,
  unsubscribe_token  TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  last_sent_at       TIMESTAMPTZ,
  unsubscribed_at    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_prefs_tenant         ON public.newsletter_preferences(tenant_id);
CREATE INDEX idx_newsletter_prefs_tenant_email   ON public.newsletter_preferences(tenant_id, email_opted_in) WHERE email_opted_in;
CREATE INDEX idx_newsletter_prefs_token          ON public.newsletter_preferences(unsubscribe_token);

-- ── Tabella 2: campagne ───────────────────────────────────────
CREATE TYPE public.newsletter_status   AS ENUM ('draft','approved','sending','sent','cancelled');
CREATE TYPE public.newsletter_occasion AS ENUM ('new_fabric','seasonal','event','custom');

CREATE TABLE public.newsletter_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  occasion            public.newsletter_occasion NOT NULL,
  status              public.newsletter_status NOT NULL DEFAULT 'draft',
  template_subject    TEXT,
  template_body_md    TEXT,
  featured_fabric_id  UUID REFERENCES public.fabrics(id) ON DELETE SET NULL,
  ai_system_prompt    TEXT,
  ai_model            TEXT,
  ai_cost_cents       NUMERIC(10,4) NOT NULL DEFAULT 0,
  recipients_count    INT NOT NULL DEFAULT 0,
  sent_count          INT NOT NULL DEFAULT 0,
  scheduled_at        TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_campaigns_tenant_created
  ON public.newsletter_campaigns(tenant_id, created_at DESC);
CREATE INDEX idx_newsletter_campaigns_status
  ON public.newsletter_campaigns(tenant_id, status);

-- ── Tabella 3: destinatari ────────────────────────────────────
CREATE TYPE public.recipient_status AS ENUM (
  'pending','sent','delivered','opened','clicked','failed','unsubscribed'
);

CREATE TABLE public.newsletter_recipients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           UUID NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel               TEXT NOT NULL CHECK (channel IN ('whatsapp','email')),
  rendered_subject      TEXT,
  rendered_body         TEXT,
  personalization_json  JSONB,
  status                public.recipient_status NOT NULL DEFAULT 'pending',
  sent_at               TIMESTAMPTZ,
  error_message         TEXT,
  resend_message_id     TEXT,
  wa_message_id         TEXT,
  UNIQUE (campaign_id, client_id)
);

CREATE INDEX idx_newsletter_recipients_campaign ON public.newsletter_recipients(campaign_id);
CREATE INDEX idx_newsletter_recipients_tenant   ON public.newsletter_recipients(tenant_id);
CREATE INDEX idx_newsletter_recipients_status   ON public.newsletter_recipients(campaign_id, status);
CREATE INDEX idx_newsletter_recipients_client   ON public.newsletter_recipients(client_id);

-- ── RLS — pattern identico a client_summaries / whatsapp_messages ──

ALTER TABLE public.newsletter_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_recipients  ENABLE ROW LEVEL SECURITY;

-- newsletter_preferences
CREATE POLICY "platform_owner full access" ON public.newsletter_preferences
  FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member read own prefs" ON public.newsletter_preferences
  FOR SELECT USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member insert own prefs" ON public.newsletter_preferences
  FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member update own prefs" ON public.newsletter_preferences
  FOR UPDATE USING (tenant_id = public.my_tenant_id())
              WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member delete own prefs" ON public.newsletter_preferences
  FOR DELETE USING (tenant_id = public.my_tenant_id());

-- newsletter_campaigns
CREATE POLICY "platform_owner full access" ON public.newsletter_campaigns
  FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member read own campaigns" ON public.newsletter_campaigns
  FOR SELECT USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member insert own campaigns" ON public.newsletter_campaigns
  FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member update own campaigns" ON public.newsletter_campaigns
  FOR UPDATE USING (tenant_id = public.my_tenant_id())
              WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member delete own campaigns" ON public.newsletter_campaigns
  FOR DELETE USING (tenant_id = public.my_tenant_id());

-- newsletter_recipients
CREATE POLICY "platform_owner full access" ON public.newsletter_recipients
  FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member read own recipients" ON public.newsletter_recipients
  FOR SELECT USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member insert own recipients" ON public.newsletter_recipients
  FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member update own recipients" ON public.newsletter_recipients
  FOR UPDATE USING (tenant_id = public.my_tenant_id())
              WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member delete own recipients" ON public.newsletter_recipients
  FOR DELETE USING (tenant_id = public.my_tenant_id());

-- Commenti
COMMENT ON TABLE public.newsletter_preferences IS 'Opt-in newsletter per cliente: email/whatsapp, token unsubscribe, throttle invii.';
COMMENT ON TABLE public.newsletter_campaigns   IS 'Campagne newsletter (draft -> approved -> sending -> sent).';
COMMENT ON TABLE public.newsletter_recipients  IS 'Destinatari di una campagna, una riga per (campaign, client) con copy personalizzata.';
COMMENT ON COLUMN public.newsletter_preferences.last_sent_at IS 'Aggiornato a fine campagna per implementare throttle (default: 1 invio / 30 giorni).';
COMMENT ON COLUMN public.newsletter_campaigns.ai_cost_cents IS 'Somma di tutti i costi LLM per generare la campagna (cent USD).';
