-- ============================================================
-- 006 — Email: campaigns e eventi (schema v2 — stub solo)
-- ============================================================

-- ── email_campaigns ───────────────────────────────────────────
CREATE TABLE public.email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subject         text NOT NULL,
  body_html       text,
  audience_filter jsonb,     -- criteri di filtraggio audience (v2)
  scheduled_at    timestamptz,
  status          public.email_campaign_status NOT NULL DEFAULT 'draft'
);

CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_email_campaigns_tenant_id ON public.email_campaigns(tenant_id);

-- ── email_events ──────────────────────────────────────────────
-- Tracking aperture/click via webhook Resend (v2)
CREATE TABLE public.email_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  campaign_id  uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  event_type   public.email_event_type NOT NULL,
  metadata     jsonb   -- payload webhook raw
);

CREATE INDEX idx_email_events_campaign_id ON public.email_events(campaign_id);
