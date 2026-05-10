-- ============================================================
-- 008 — Storage buckets
-- ============================================================

-- Bucket per i leaflet PDF generati
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leaflets',
  'leaflets',
  false,   -- privato: accesso solo via signed URL
  10485760, -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket per assets: loghi tenant, foto cliente, immagini tessuti
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,    -- pubblico: immagini prodotto e loghi
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS policies ──────────────────────────────────────

-- ASSETS: upload solo per tenant member, lettura pubblica (bucket è public)
CREATE POLICY "tenant member può caricare assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets'
    AND (public.is_platform_owner() OR public.is_tenant_member(
      (storage.foldername(name))[1]::uuid
    ))
  );

CREATE POLICY "tenant member può eliminare propri assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assets'
    AND (public.is_platform_owner() OR public.is_tenant_member(
      (storage.foldername(name))[1]::uuid
    ))
  );

-- LEAFLETS: accesso solo per tenant member (bucket privato)
CREATE POLICY "tenant member può caricare leaflet"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'leaflets'
    AND (public.is_platform_owner() OR public.is_tenant_member(
      (storage.foldername(name))[1]::uuid
    ))
  );

CREATE POLICY "tenant member può leggere propri leaflet"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'leaflets'
    AND (public.is_platform_owner() OR public.is_tenant_member(
      (storage.foldername(name))[1]::uuid
    ))
  );

CREATE POLICY "tenant member può eliminare propri leaflet"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'leaflets'
    AND (public.is_platform_owner() OR public.is_tenant_member(
      (storage.foldername(name))[1]::uuid
    ))
  );
