-- ============================================================
-- 019b — Migrazione integration WhatsApp Scarano (single-tenant → multi-tenant)
-- ============================================================
-- PRIMA di applicare questa migration:
--   1. Settare app.wa_encryption_key in Supabase (vedi 019_whatsapp_integrations.sql)
--   2. Rieseguire ALTER DATABASE ... SET app.wa_encryption_key = ... + SELECT pg_reload_conf();
--
-- Dopo l'INSERT, eseguire SEPARATAMENTE l'UPDATE che cifra il token
-- (lo lascio fuori da questo file per non hardcodare segreti):
--
--   UPDATE public.whatsapp_integrations
--   SET access_token_encrypted = pgp_sym_encrypt(
--         '<WHATSAPP_CLOUD_API_TOKEN_PLAINTEXT>',
--         current_setting('app.wa_encryption_key')
--       ),
--       status = 'connected',
--       connected_at = now()
--   WHERE tenant_id = 'db057da1-b786-410e-8db4-223183a42ab8';
--
-- ============================================================

-- Placeholder bytea (\x00) per soddisfare il NOT NULL.
-- Va sostituito subito dopo con pgp_sym_encrypt (vedi commento sopra).
INSERT INTO public.whatsapp_integrations (
  tenant_id,
  phone_number_id,
  waba_id,
  display_phone_number,
  verified_name,
  access_token_encrypted,
  token_type,
  status,
  connected_at
) VALUES (
  'db057da1-b786-410e-8db4-223183a42ab8',
  '1109045942291988',
  '1426242095939078',
  NULL,
  'Sartoria Scarano',
  '\x00'::bytea,
  'system_user',
  'pending',
  now()
)
ON CONFLICT (tenant_id) DO NOTHING;
