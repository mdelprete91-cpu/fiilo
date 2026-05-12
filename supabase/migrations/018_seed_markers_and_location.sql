-- ============================================================
-- 018 — Seed markers + tenant location/activity per Overview admin
-- ============================================================

-- ── seed_batch reversibile ───────────────────────────────────
-- Dato seed (clienti demo, tenant dummy) viene taggato con un batch ID.
-- Cleanup via /api/admin/seed-cleanup → DELETE WHERE seed_batch = '...'.
-- I dati produzione restano sempre con seed_batch IS NULL.

ALTER TABLE public.tenants            ADD COLUMN seed_batch text NULL;
ALTER TABLE public.clients            ADD COLUMN seed_batch text NULL;
ALTER TABLE public.garments           ADD COLUMN seed_batch text NULL;
ALTER TABLE public.whatsapp_messages  ADD COLUMN seed_batch text NULL;

CREATE INDEX idx_tenants_seed_batch
  ON public.tenants(seed_batch) WHERE seed_batch IS NOT NULL;
CREATE INDEX idx_clients_seed_batch
  ON public.clients(seed_batch) WHERE seed_batch IS NOT NULL;
CREATE INDEX idx_garments_seed_batch
  ON public.garments(seed_batch) WHERE seed_batch IS NOT NULL;
CREATE INDEX idx_whatsapp_messages_seed_batch
  ON public.whatsapp_messages(seed_batch) WHERE seed_batch IS NOT NULL;

-- ── coordinate + attività per mappa Italia ───────────────────
-- Usate dall'Overview admin (/platform) per visualizzare le sartorie
-- attive sulla mappa.

ALTER TABLE public.tenants
  ADD COLUMN latitude       numeric(9,6) NULL,
  ADD COLUMN longitude      numeric(9,6) NULL,
  ADD COLUMN last_active_at timestamptz  NULL;
