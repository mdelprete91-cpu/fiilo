-- ============================================================
-- 025 — External links: fabrics → sito sartoria + tenants website
-- ============================================================
ALTER TABLE public.fabrics
  ADD COLUMN IF NOT EXISTS external_url TEXT;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN public.fabrics.external_url IS
  'Link alla pagina prodotto sul sito della sartoria. Usato nelle newsletter come CTA primaria.';
COMMENT ON COLUMN public.tenants.website_url IS
  'URL principale del sito vetrina della sartoria. Usato per fallback link e onboarding AI.';
