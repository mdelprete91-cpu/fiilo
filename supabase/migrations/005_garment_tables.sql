-- ============================================================
-- 005 — Abiti: garments, configurazioni, allegati
-- ============================================================

-- ── garments ─────────────────────────────────────────────────
CREATE TABLE public.garments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  tenant_id                   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id                   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type                        public.garment_type NOT NULL,
  name                        text,            -- es. "Abito matrimonio Marco"
  status                      public.garment_status NOT NULL DEFAULT 'draft',
  confirmed_measurement_id    uuid REFERENCES public.client_measurements(id),
  total_price                 numeric(10,2),
  currency                    text NOT NULL DEFAULT 'EUR',
  delivery_eta                date,
  internal_notes              text
);

CREATE TRIGGER garments_updated_at
  BEFORE UPDATE ON public.garments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_garments_tenant_id ON public.garments(tenant_id);
CREATE INDEX idx_garments_client_id ON public.garments(client_id);
CREATE INDEX idx_garments_status ON public.garments(tenant_id, status);

-- ── garment_configurations ───────────────────────────────────
-- JSONB con tutte le scelte del configuratore
CREATE TABLE public.garment_configurations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  garment_id   uuid NOT NULL REFERENCES public.garments(id) ON DELETE CASCADE UNIQUE,
  configuration jsonb NOT NULL DEFAULT '{}'
);

CREATE TRIGGER garment_configurations_updated_at
  BEFORE UPDATE ON public.garment_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_garment_configurations_garment_id ON public.garment_configurations(garment_id);
CREATE INDEX idx_garment_configurations_tenant_id ON public.garment_configurations(tenant_id);

-- ── garment_attachments ──────────────────────────────────────
CREATE TABLE public.garment_attachments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  garment_id uuid NOT NULL REFERENCES public.garments(id) ON DELETE CASCADE,
  url        text NOT NULL,
  label      text,
  type       public.attachment_type NOT NULL DEFAULT 'photo'
);

CREATE INDEX idx_garment_attachments_garment_id ON public.garment_attachments(garment_id);
CREATE INDEX idx_garment_attachments_tenant_id ON public.garment_attachments(tenant_id);
