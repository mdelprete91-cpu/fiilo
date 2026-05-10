-- ============================================================
-- 010 — Garments: assegnatario e materiali mancanti
-- ============================================================

ALTER TABLE public.garments
  ADD COLUMN IF NOT EXISTS assigned_to     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS needs_materials boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_garments_assigned_to ON public.garments(assigned_to);
