-- ============================================================
-- 019 — WhatsApp Business multi-tenant integrations
-- ============================================================
-- Tabella per onboarding self-service via Meta Embedded Signup.
-- Ogni tenant collega il proprio WhatsApp Business; il webhook
-- risolve il tenant via phone_number_id e legge il token cifrato.
--
-- Chiave di crittografia: settare app.wa_encryption_key in Supabase
-- (Dashboard → Project Settings → Database → Custom Postgres Config)
-- oppure via SQL:
--   ALTER DATABASE postgres
--     SET app.wa_encryption_key = '<32-char-random-key>';
--   SELECT pg_reload_conf();
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.whatsapp_integrations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id                UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id          TEXT NOT NULL UNIQUE,
  waba_id                  TEXT NOT NULL,
  business_id              TEXT,
  display_phone_number     TEXT,
  verified_name            TEXT,
  access_token_encrypted   BYTEA NOT NULL,
  token_type               TEXT CHECK (token_type IN ('user', 'system_user')),
  token_expires_at         TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','connected','error','revoked')),
  last_error               TEXT,
  connected_at             TIMESTAMPTZ,
  connected_by_user_id     UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_wa_integrations_phone_number_id ON public.whatsapp_integrations(phone_number_id);
CREATE INDEX idx_wa_integrations_tenant_id       ON public.whatsapp_integrations(tenant_id);

-- Trigger: aggiorna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at_whatsapp_integrations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wa_integrations_updated_at
  BEFORE UPDATE ON public.whatsapp_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_whatsapp_integrations();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_owner full access"
  ON public.whatsapp_integrations FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member read own integration"
  ON public.whatsapp_integrations FOR SELECT
  USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member update own integration"
  ON public.whatsapp_integrations FOR UPDATE
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── Funzioni cifratura token (SECURITY DEFINER) ──────────────
-- Il token plaintext NON deve mai essere letto dal client: queste
-- funzioni vanno chiamate solo da service-role / RPC server-side.

CREATE OR REPLACE FUNCTION public.set_wa_token(
  p_integration_id UUID,
  p_plaintext      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_key TEXT := current_setting('app.wa_encryption_key', true);
BEGIN
  IF v_key IS NULL OR length(v_key) < 16 THEN
    RAISE EXCEPTION 'app.wa_encryption_key non configurata o troppo corta';
  END IF;

  UPDATE public.whatsapp_integrations
  SET access_token_encrypted = pgp_sym_encrypt(p_plaintext, v_key)
  WHERE id = p_integration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_wa_token(
  p_integration_id UUID
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_key    TEXT := current_setting('app.wa_encryption_key', true);
  v_cipher BYTEA;
BEGIN
  IF v_key IS NULL OR length(v_key) < 16 THEN
    RAISE EXCEPTION 'app.wa_encryption_key non configurata o troppo corta';
  END IF;

  SELECT access_token_encrypted INTO v_cipher
  FROM public.whatsapp_integrations
  WHERE id = p_integration_id;

  IF v_cipher IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(v_cipher, v_key);
END;
$$;

-- Le funzioni sono SECURITY DEFINER ma richiediamo che vengano
-- chiamate via service-role: revochiamo l'EXECUTE a anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.set_wa_token(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_wa_token(UUID)       FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_wa_token(UUID, TEXT) TO service_role;
GRANT  EXECUTE ON FUNCTION public.get_wa_token(UUID)       TO service_role;
