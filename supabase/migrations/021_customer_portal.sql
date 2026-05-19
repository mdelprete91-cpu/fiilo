-- ============================================================
-- 021 — Customer Portal: ruoli, inviti, link cliente-utente, RLS
-- ============================================================
-- Scope:
--   • Aggiunge il valore enum `customer_end_user` a tenant_role (il valore
--     legacy `customer` resta per retro-compatibilità: in v1 era previsto
--     ma mai usato).
--   • Aggiunge `submitted` a garment_status per richieste cliente.
--   • Colonne nuove: garments.submitted_by_customer + submitted_at,
--     tenants.show_prices_to_customers.
--   • Tabelle: client_user_links, customer_invites.
--   • Helper: my_client_id(), is_customer_of_tenant().
--   • RLS specifico cliente per le tabelle esposte al portale.
--   • RPC pubblica portal_get_tenant_by_slug(text) per lookup tenant anonimo.
-- ============================================================
-- ⚠️ APPLICAZIONE: PostgreSQL non permette di usare un nuovo valore enum
-- nella stessa transazione in cui è stato aggiunto. Se la tua catena di
-- migrations gira l'intero file in un'unica transazione, applica questo
-- file in due passi:
--   1) Esegui SOLO le due ALTER TYPE qui sotto, COMMIT.
--   2) Riesegui l'intero file (IF NOT EXISTS è idempotente per il resto).
-- Se applichi via Supabase Studio SQL Editor, di default ogni query
-- separata da `;` è una transazione a sé — quindi un singolo invio funziona.
-- ============================================================

-- ── Estensioni enum ──────────────────────────────────────────

ALTER TYPE public.tenant_role ADD VALUE IF NOT EXISTS 'customer_end_user';

ALTER TYPE public.garment_status ADD VALUE IF NOT EXISTS 'submitted';

-- ── Colonne nuove ────────────────────────────────────────────

ALTER TABLE public.garments
  ADD COLUMN IF NOT EXISTS submitted_by_customer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at          timestamptz;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS show_prices_to_customers boolean NOT NULL DEFAULT true;

-- ── client_user_links ────────────────────────────────────────
-- 1 cliente ↔ 1 utente Supabase (auth.users). Usata da my_client_id().

CREATE TABLE IF NOT EXISTS public.client_user_links (
  client_id     uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz,
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_client_user_links_user ON public.client_user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_links_tenant ON public.client_user_links(tenant_id);

-- ── customer_invites ─────────────────────────────────────────
-- Token a uso singolo, 7 giorni. Usato dal sarto per invitare un cliente.

CREATE TABLE IF NOT EXISTS public.customer_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  token       text NOT NULL UNIQUE,
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at     timestamptz,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_invites_client ON public.customer_invites(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_invites_tenant ON public.customer_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_invites_token ON public.customer_invites(token);

-- ── Helper RLS ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.my_client_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cul.client_id
  FROM public.client_user_links cul
  WHERE cul.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.user_id = auth.uid()
        AND utr.role = 'customer_end_user'
        AND utr.tenant_id = cul.tenant_id
    )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_customer_of_tenant(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_tenant_roles utr
    JOIN public.client_user_links cul ON cul.user_id = utr.user_id AND cul.tenant_id = utr.tenant_id
    WHERE utr.user_id = auth.uid()
      AND utr.role = 'customer_end_user'
      AND utr.tenant_id = p_tenant_id
  );
$$;

-- ── RLS: client_user_links ───────────────────────────────────

ALTER TABLE public.client_user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_owner full access client_user_links"
  ON public.client_user_links FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member legge link del proprio tenant"
  ON public.client_user_links FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "tenant member gestisce link del proprio tenant"
  ON public.client_user_links FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "customer legge il proprio link"
  ON public.client_user_links FOR SELECT
  USING (user_id = auth.uid());

-- ── RLS: customer_invites ────────────────────────────────────

ALTER TABLE public.customer_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_owner full access customer_invites"
  ON public.customer_invites FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member gestisce inviti del proprio tenant"
  ON public.customer_invites FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- ── RLS aggiuntive per customer_end_user su tabelle esistenti ─

-- CLIENTS: il cliente vede solo la sua riga
CREATE POLICY "customer legge la propria scheda"
  ON public.clients FOR SELECT
  USING (id = public.my_client_id());

-- CLIENT_MEASUREMENTS: il cliente legge le proprie misure
CREATE POLICY "customer legge le proprie misure"
  ON public.client_measurements FOR SELECT
  USING (client_id = public.my_client_id());

-- GARMENTS: il cliente vede tutti i suoi abiti (qualsiasi status, per timeline)
CREATE POLICY "customer legge i propri abiti"
  ON public.garments FOR SELECT
  USING (client_id = public.my_client_id());

-- GARMENTS: il cliente può inserire abiti solo per sé, come draft
CREATE POLICY "customer inserisce propri abiti draft"
  ON public.garments FOR INSERT
  WITH CHECK (
    client_id = public.my_client_id()
    AND status IN ('draft', 'submitted')
  );

-- GARMENTS: il cliente può aggiornare solo i propri draft/submitted
CREATE POLICY "customer aggiorna propri abiti draft o submitted"
  ON public.garments FOR UPDATE
  USING (
    client_id = public.my_client_id()
    AND status IN ('draft', 'submitted')
  )
  WITH CHECK (
    client_id = public.my_client_id()
    AND status IN ('draft', 'submitted')
  );

-- GARMENT_CONFIGURATIONS: gestite via JOIN su garments.client_id
CREATE POLICY "customer legge configurazioni dei propri abiti"
  ON public.garment_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.garments g
      WHERE g.id = garment_configurations.garment_id
        AND g.client_id = public.my_client_id()
    )
  );

CREATE POLICY "customer inserisce configurazioni dei propri abiti"
  ON public.garment_configurations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.garments g
      WHERE g.id = garment_configurations.garment_id
        AND g.client_id = public.my_client_id()
        AND g.status IN ('draft', 'submitted')
    )
  );

CREATE POLICY "customer aggiorna configurazioni dei propri abiti"
  ON public.garment_configurations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.garments g
      WHERE g.id = garment_configurations.garment_id
        AND g.client_id = public.my_client_id()
        AND g.status IN ('draft', 'submitted')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.garments g
      WHERE g.id = garment_configurations.garment_id
        AND g.client_id = public.my_client_id()
        AND g.status IN ('draft', 'submitted')
    )
  );

-- CATALOGO: il cliente legge i prodotti disponibili del proprio tenant
CREATE POLICY "customer legge tessuti disponibili del proprio tenant"
  ON public.fabrics FOR SELECT
  USING (
    is_available = true
    AND public.is_customer_of_tenant(tenant_id)
  );

CREATE POLICY "customer legge fodere disponibili del proprio tenant"
  ON public.linings FOR SELECT
  USING (
    is_available = true
    AND public.is_customer_of_tenant(tenant_id)
  );

CREATE POLICY "customer legge bottoni disponibili del proprio tenant"
  ON public.buttons FOR SELECT
  USING (
    is_available = true
    AND public.is_customer_of_tenant(tenant_id)
  );

CREATE POLICY "customer legge fili disponibili del proprio tenant"
  ON public.thread_colors FOR SELECT
  USING (
    is_available = true
    AND public.is_customer_of_tenant(tenant_id)
  );

-- TENANTS: il cliente legge solo i campi del suo tenant (read-only)
CREATE POLICY "customer legge il proprio tenant"
  ON public.tenants FOR SELECT
  USING (public.is_customer_of_tenant(id));

-- ── RPC pubblica: lookup tenant per slug ─────────────────────
-- Accessibile da anon (login/invite page non hanno ancora sessione).
-- Ritorna solo campi safe — niente email, phone, address, plan.

CREATE OR REPLACE FUNCTION public.portal_get_tenant_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  logo_url text,
  brand_color text,
  show_prices_to_customers boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name, t.logo_url, t.brand_color, t.show_prices_to_customers
  FROM public.tenants t
  WHERE t.slug = p_slug AND t.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.portal_get_tenant_by_slug(text) TO anon, authenticated;

-- ── Commenti ─────────────────────────────────────────────────

COMMENT ON TABLE  public.client_user_links IS 'Mappa 1-1 cliente ↔ utente Supabase per il portale.';
COMMENT ON TABLE  public.customer_invites IS 'Token monouso (7gg) per onboarding cliente al portale.';
COMMENT ON FUNCTION public.my_client_id() IS 'Ritorna client_id dell''utente customer_end_user corrente, NULL altrimenti.';
COMMENT ON FUNCTION public.portal_get_tenant_by_slug(text) IS 'Lookup pubblico di un tenant per slug (solo campi safe per portale).';
