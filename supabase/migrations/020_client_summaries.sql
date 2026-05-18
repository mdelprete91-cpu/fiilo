-- ============================================================
-- 020 — Sintesi AI per cliente
-- ============================================================
-- Una riga per (tenant, cliente). Riassume i messaggi WhatsApp del cliente
-- come JSON strutturato + testo. Generata on-demand da Claude Haiku 4.5.
-- ============================================================

CREATE TABLE public.client_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  summary_json          JSONB NOT NULL,
  summary_text          TEXT,
  model                 TEXT NOT NULL,
  tokens_in             INT,
  tokens_out            INT,
  cost_cents            NUMERIC(10,4),
  source_message_count  INT NOT NULL DEFAULT 0,
  last_message_sent_at  TIMESTAMPTZ,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by          UUID REFERENCES auth.users(id),
  UNIQUE (tenant_id, client_id)
);

CREATE INDEX idx_client_summaries_client ON public.client_summaries(client_id);
CREATE INDEX idx_client_summaries_tenant_generated
  ON public.client_summaries(tenant_id, generated_at DESC);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.client_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_owner full access" ON public.client_summaries
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

CREATE POLICY "tenant member read own summaries" ON public.client_summaries
  FOR SELECT
  USING (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member insert own summaries" ON public.client_summaries
  FOR INSERT
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member update own summaries" ON public.client_summaries
  FOR UPDATE
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE POLICY "tenant member delete own summaries" ON public.client_summaries
  FOR DELETE
  USING (tenant_id = public.my_tenant_id());

COMMENT ON TABLE  public.client_summaries IS 'Sintesi AI dei messaggi WhatsApp per cliente, generate on-demand.';
COMMENT ON COLUMN public.client_summaries.summary_json IS 'Struttura: preferences, pending_measurements, visual_references, events, relationship_status, citations.';
COMMENT ON COLUMN public.client_summaries.cost_cents IS 'Costo stimato in centesimi USD (input × 0.0001¢ + output × 0.0005¢ per token).';
COMMENT ON COLUMN public.client_summaries.last_message_sent_at IS 'sent_at del messaggio più recente analizzato. Permette di sapere se ci sono nuovi messaggi da quando la sintesi è stata generata.';
