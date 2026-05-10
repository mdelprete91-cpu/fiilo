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
