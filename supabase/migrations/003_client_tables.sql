-- ============================================================
-- 003 — Clienti e misure
-- ============================================================

-- ── clients ──────────────────────────────────────────────────
CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  email         text,
  phone         text,
  date_of_birth date,
  address       text,
  city          text,
  country       text,
  notes         text,
  photo_url     text
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_last_name ON public.clients(tenant_id, last_name);

-- ── client_measurements ──────────────────────────────────────
-- Versionato: ogni aggiornamento crea una nuova riga, mai UPDATE distruttivo
CREATE TABLE public.client_measurements (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  taken_at           timestamptz NOT NULL DEFAULT now(),
  taken_by           uuid NOT NULL REFERENCES auth.users(id),

  -- Misure superiori (cm)
  chest              numeric(5,1),  -- torace
  waist              numeric(5,1),  -- vita
  hips               numeric(5,1),  -- fianchi
  shoulders          numeric(5,1),  -- spalle
  sleeve_length      numeric(5,1),  -- lunghezza manica
  back_length        numeric(5,1),  -- lunghezza schiena
  neck               numeric(5,1),  -- collo
  wrist              numeric(5,1),  -- polso

  -- Misure inferiori (cm)
  crotch             numeric(5,1),  -- cavallo
  inseam             numeric(5,1),  -- lunghezza interna gamba
  outseam            numeric(5,1),  -- lunghezza esterna gamba
  thigh              numeric(5,1),  -- coscia
  knee               numeric(5,1),  -- ginocchio
  calf               numeric(5,1),  -- polpaccio
  ankle              numeric(5,1),  -- caviglia

  -- Corporatura generale
  weight             numeric(5,1),  -- kg
  height             numeric(5,1),  -- cm

  -- Note posturali (campo testo libero)
  posture_notes      text
);

-- Non ha updated_at: versioning immutabile
CREATE INDEX idx_client_measurements_client_id ON public.client_measurements(client_id);
CREATE INDEX idx_client_measurements_tenant_id ON public.client_measurements(tenant_id);
CREATE INDEX idx_client_measurements_taken_at ON public.client_measurements(client_id, taken_at DESC);
