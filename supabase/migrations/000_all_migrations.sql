-- ============================================================
-- 001 — Enumerazioni di dominio
-- ============================================================

CREATE TYPE public.tenant_plan AS ENUM (
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE public.tenant_role AS ENUM (
  'platform_owner',
  'tenant_admin',
  'tenant_staff',
  'customer'       -- previsto v2, non usato in v1
);

CREATE TYPE public.garment_type AS ENUM (
  'suit_2pc',
  'suit_3pc',
  'jacket',
  'trousers',
  'waistcoat',
  'coat',
  'tuxedo',
  'shirt'
);

CREATE TYPE public.garment_status AS ENUM (
  'draft',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE public.fabric_pattern AS ENUM (
  'solid',
  'striped',
  'checked',
  'herringbone',
  'houndstooth',
  'plaid',
  'windowpane',
  'paisley',
  'other'
);

CREATE TYPE public.fabric_season AS ENUM (
  'spring_summer',
  'autumn_winter',
  'all_season'
);

CREATE TYPE public.button_material AS ENUM (
  'horn',
  'corozo',
  'mother_of_pearl',
  'plastic',
  'metal'
);

CREATE TYPE public.attachment_type AS ENUM (
  'photo',
  'inspiration',
  'sketch',
  'leaflet'
);

CREATE TYPE public.email_campaign_status AS ENUM (
  'draft',
  'scheduled',
  'sent',
  'cancelled'
);

CREATE TYPE public.email_event_type AS ENUM (
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'unsubscribed'
);
-- ============================================================
-- 002 — Tabelle core: tenants, profiles, ruoli
-- ============================================================

-- Utility: aggiorna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── tenants ──────────────────────────────────────────────────
CREATE TABLE public.tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  logo_url      text,
  brand_color   text,
  email         text,
  phone         text,
  address       text,
  city          text,
  country       text NOT NULL DEFAULT 'IT',
  plan          public.tenant_plan NOT NULL DEFAULT 'starter',
  is_active     boolean NOT NULL DEFAULT true
);

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── profiles (estende auth.users) ───────────────────────────
CREATE TABLE public.profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  full_name          text,
  avatar_url         text,
  preferred_language text NOT NULL DEFAULT 'it'
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Crea profilo automaticamente quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── user_tenant_roles ────────────────────────────────────────
CREATE TABLE public.user_tenant_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- tenant_id è NULL per platform_owner (non appartiene ad un tenant specifico)
  role       public.tenant_role NOT NULL,
  UNIQUE (user_id, tenant_id, role)
);

-- ── audit_logs ───────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  tenant_id     uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   uuid,
  metadata      jsonb,
  ip_address    inet
);

-- Indici
CREATE INDEX idx_user_tenant_roles_user_id ON public.user_tenant_roles(user_id);
CREATE INDEX idx_user_tenant_roles_tenant_id ON public.user_tenant_roles(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
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
-- ============================================================
-- 007 — Row Level Security
-- ============================================================
-- Strategia:
--   • platform_owner: accesso totale a tutto
--   • tenant_admin / tenant_staff: solo il proprio tenant_id
--   • Nessun dato attraversa mai i confini del tenant
-- ============================================================

-- Helper: ritorna il tenant_id dell'utente corrente (primo tenant trovato)
-- Per platform_owner ritorna NULL (ha accesso a tutto via policy separata)
CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id
  FROM public.user_tenant_roles
  WHERE user_id = auth.uid()
    AND role IN ('tenant_admin', 'tenant_staff')
  LIMIT 1;
$$;

-- Helper: è platform_owner?
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenant_roles
    WHERE user_id = auth.uid() AND role = 'platform_owner'
  );
$$;

-- Helper: è admin o staff del tenant dato?
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenant_roles
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND role IN ('tenant_admin', 'tenant_staff')
  );
$$;

-- Helper: è tenant_admin del tenant dato?
CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenant_roles
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND role = 'tenant_admin'
  );
$$;

-- ── Abilita RLS su tutte le tabelle ──────────────────────────

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── TENANTS ──────────────────────────────────────────────────

CREATE POLICY "platform_owner può tutto su tenants"
  ON public.tenants FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member può leggere il proprio tenant"
  ON public.tenants FOR SELECT
  USING (public.is_tenant_member(id));

-- ── PROFILES ─────────────────────────────────────────────────

CREATE POLICY "utente legge e aggiorna il proprio profilo"
  ON public.profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "platform_owner legge tutti i profili"
  ON public.profiles FOR SELECT
  USING (public.is_platform_owner());

-- ── USER_TENANT_ROLES ─────────────────────────────────────────

CREATE POLICY "platform_owner gestisce tutti i ruoli"
  ON public.user_tenant_roles FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant_admin gestisce ruoli del proprio tenant"
  ON public.user_tenant_roles FOR ALL
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "utente legge i propri ruoli"
  ON public.user_tenant_roles FOR SELECT
  USING (user_id = auth.uid());

-- ── Macro: policy per tabelle con tenant_id ───────────────────
-- Riutilizzata per clients, misure, catalogo, abiti

-- CLIENTS
CREATE POLICY "platform_owner vede tutti i clienti"
  ON public.clients FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce clienti del proprio tenant"
  ON public.clients FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- CLIENT_MEASUREMENTS
CREATE POLICY "platform_owner vede tutte le misure"
  ON public.client_measurements FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce misure del proprio tenant"
  ON public.client_measurements FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- FABRICS
CREATE POLICY "platform_owner vede tutti i tessuti"
  ON public.fabrics FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce tessuti del proprio tenant"
  ON public.fabrics FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- LININGS
CREATE POLICY "platform_owner vede tutte le fodere"
  ON public.linings FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce fodere del proprio tenant"
  ON public.linings FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- BUTTONS
CREATE POLICY "platform_owner vede tutti i bottoni"
  ON public.buttons FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce bottoni del proprio tenant"
  ON public.buttons FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- THREAD_COLORS
CREATE POLICY "platform_owner vede tutti i colori filo"
  ON public.thread_colors FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce colori filo del proprio tenant"
  ON public.thread_colors FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- GARMENTS
CREATE POLICY "platform_owner vede tutti gli abiti"
  ON public.garments FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce abiti del proprio tenant"
  ON public.garments FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- GARMENT_CONFIGURATIONS
CREATE POLICY "platform_owner vede tutte le configurazioni"
  ON public.garment_configurations FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce configurazioni del proprio tenant"
  ON public.garment_configurations FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- GARMENT_ATTACHMENTS
CREATE POLICY "platform_owner vede tutti gli allegati"
  ON public.garment_attachments FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce allegati del proprio tenant"
  ON public.garment_attachments FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- EMAIL_CAMPAIGNS
CREATE POLICY "platform_owner vede tutte le campagne"
  ON public.email_campaigns FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce campagne del proprio tenant"
  ON public.email_campaigns FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND tenant_id = public.my_tenant_id());

-- EMAIL_EVENTS (solo lettura per tenant, inserimento via webhook service role)
CREATE POLICY "platform_owner vede tutti gli eventi email"
  ON public.email_events FOR SELECT
  USING (public.is_platform_owner());

CREATE POLICY "tenant member legge eventi delle proprie campagne"
  ON public.email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns ec
      WHERE ec.id = email_events.campaign_id
        AND public.is_tenant_member(ec.tenant_id)
    )
  );

-- AUDIT_LOGS (solo lettura)
CREATE POLICY "platform_owner legge tutti gli audit log"
  ON public.audit_logs FOR SELECT
  USING (public.is_platform_owner());

CREATE POLICY "tenant admin legge audit log del proprio tenant"
  ON public.audit_logs FOR SELECT
  USING (public.is_tenant_admin(tenant_id));
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

-- ============================================================
-- 009 — Configuratore: campi aggiuntivi su garments
-- ============================================================

ALTER TABLE public.garments
  ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_step  text NOT NULL DEFAULT 'fabric';

-- ============================================================
-- 010 — Garments: assegnatario e materiali mancanti
-- ============================================================

ALTER TABLE public.garments
  ADD COLUMN IF NOT EXISTS assigned_to     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS needs_materials boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_garments_assigned_to ON public.garments(assigned_to);
