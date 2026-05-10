-- ============================================================
-- 004 — Catalogo: tessuti, fodere, bottoni, fili
-- ============================================================

-- ── fabrics ──────────────────────────────────────────────────
CREATE TABLE public.fabrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  mill             text,           -- mulino: Loro Piana, VBC, Drago, ecc.
  code             text,           -- codice tessuto del mulino
  composition      text,           -- es. "100% Lana Vergine"
  weight_grams     integer,        -- grammi per metro
  color            text,
  pattern          public.fabric_pattern,
  image_url        text,
  price_per_meter  numeric(10,2),
  currency         text NOT NULL DEFAULT 'EUR',
  is_available     boolean NOT NULL DEFAULT true,
  season           public.fabric_season
);

CREATE TRIGGER fabrics_updated_at
  BEFORE UPDATE ON public.fabrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_fabrics_tenant_id ON public.fabrics(tenant_id);

-- ── linings ──────────────────────────────────────────────────
CREATE TABLE public.linings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  color        text,
  material     text,
  image_url    text,
  is_available boolean NOT NULL DEFAULT true
);

CREATE TRIGGER linings_updated_at
  BEFORE UPDATE ON public.linings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_linings_tenant_id ON public.linings(tenant_id);

-- ── buttons ──────────────────────────────────────────────────
CREATE TABLE public.buttons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  material     public.button_material NOT NULL DEFAULT 'corozo',
  color        text,
  finish       text,          -- es. "lucido", "opaco", "naturale"
  image_url    text,
  is_available boolean NOT NULL DEFAULT true
);

CREATE TRIGGER buttons_updated_at
  BEFORE UPDATE ON public.buttons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_buttons_tenant_id ON public.buttons(tenant_id);

-- ── thread_colors ─────────────────────────────────────────────
CREATE TABLE public.thread_colors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  hex_color    text NOT NULL,    -- es. "#C0392B"
  is_available boolean NOT NULL DEFAULT true
);

CREATE TRIGGER thread_colors_updated_at
  BEFORE UPDATE ON public.thread_colors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_thread_colors_tenant_id ON public.thread_colors(tenant_id);
