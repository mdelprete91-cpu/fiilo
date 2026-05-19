-- ============================================================
-- 023 — WhatsApp Catalog Auto-Push (Marketing)
-- ============================================================
-- Estende clients per opt-out marketing + introduce:
--   • whatsapp_message_templates  (registry template Meta per tenant)
--   • fabric_announcements        (annunci tessuti inviati ai clienti)
--   • tenant_marketing_settings   (cap mensile + flag globale)
-- ============================================================

-- ── clients: campi marketing ─────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS marketing_optout       BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_optout_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS language               TEXT        DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS last_marketing_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clients_marketing_optout
  ON public.clients(tenant_id, marketing_optout);

-- ── Registry template WhatsApp Meta per tenant ───────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_message_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,                 -- es. 'fabric_announcement_it'
  category          TEXT NOT NULL,                 -- MARKETING|UTILITY|AUTHENTICATION
  language          TEXT NOT NULL,                 -- es. 'it' o 'it_IT'
  header_type       TEXT,                          -- IMAGE|TEXT|none
  body_text         TEXT NOT NULL,                 -- con placeholder {{1}} {{2}}…
  variable_count    INT  NOT NULL DEFAULT 0,
  meta_template_id  TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected')),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, language)
);

CREATE INDEX IF NOT EXISTS idx_wa_templates_tenant
  ON public.whatsapp_message_templates(tenant_id);

-- ── Annunci tessuti (lifecycle preview → sent) ───────────────
DO $$ BEGIN
  CREATE TYPE public.announcement_status AS ENUM (
    'pending_review','approved','sent','failed','skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.fabric_announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id)  ON DELETE CASCADE,
  fabric_id     UUID NOT NULL REFERENCES public.fabrics(id)  ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.clients(id)  ON DELETE CASCADE,
  status        public.announcement_status NOT NULL DEFAULT 'pending_review',
  match_score   INT,
  match_reason  TEXT,
  message_body  TEXT,
  wa_message_id TEXT,
  sent_at       TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fabric_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_fabric_announcements_tenant_fabric
  ON public.fabric_announcements(tenant_id, fabric_id);
CREATE INDEX IF NOT EXISTS idx_fabric_announcements_client
  ON public.fabric_announcements(client_id);
CREATE INDEX IF NOT EXISTS idx_fabric_announcements_status
  ON public.fabric_announcements(tenant_id, status);

-- ── Settings marketing per tenant ────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_marketing_settings (
  tenant_id          UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  monthly_cap        INT         NOT NULL DEFAULT 50,
  current_month_sent INT         NOT NULL DEFAULT 0,
  cap_reset_at       TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now() + interval '1 month'),
  marketing_enabled  BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabric_announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_marketing_settings  ENABLE ROW LEVEL SECURITY;

-- whatsapp_message_templates
CREATE POLICY "platform_owner full access on wa_templates"
  ON public.whatsapp_message_templates FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member reads own wa_templates"
  ON public.whatsapp_message_templates FOR SELECT
  USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant_admin manages own wa_templates"
  ON public.whatsapp_message_templates FOR ALL
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- fabric_announcements
CREATE POLICY "platform_owner full access on fabric_announcements"
  ON public.fabric_announcements FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member manages own fabric_announcements"
  ON public.fabric_announcements FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- tenant_marketing_settings
CREATE POLICY "platform_owner full access on marketing_settings"
  ON public.tenant_marketing_settings FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member reads own marketing_settings"
  ON public.tenant_marketing_settings FOR SELECT
  USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant_admin manages own marketing_settings"
  ON public.tenant_marketing_settings FOR ALL
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

COMMENT ON TABLE public.whatsapp_message_templates IS 'Registry dei template WhatsApp Meta approvati per ciascun tenant.';
COMMENT ON TABLE public.fabric_announcements      IS 'Annunci di nuovi tessuti inviati (o da inviare) via WhatsApp ai clienti potenzialmente interessati.';
COMMENT ON TABLE public.tenant_marketing_settings IS 'Configurazione marketing per tenant: cap mensile, contatore, flag globale.';
