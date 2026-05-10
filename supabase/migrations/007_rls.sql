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
