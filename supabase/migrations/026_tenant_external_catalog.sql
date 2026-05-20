-- ============================================================
-- 026 — Catalogo esterno importato dal sito sartoria
-- ============================================================
-- Tabella per memorizzare le pagine prodotto/catalogo scoperte
-- automaticamente dall'AI sul sito vetrina della sartoria.
-- Usate per linkare le newsletter alle pagine giuste sul sito.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_external_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  title           TEXT,
  image_url       TEXT,
  description     TEXT,
  detected_kind   TEXT,
  language        TEXT,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, url)
);

CREATE INDEX IF NOT EXISTS idx_tec_tenant ON public.tenant_external_catalog(tenant_id);

ALTER TABLE public.tenant_external_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_catalog: select own"
  ON public.tenant_external_catalog FOR SELECT
  USING (tenant_id = public.my_tenant_id());

CREATE POLICY "external_catalog: write own"
  ON public.tenant_external_catalog FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
