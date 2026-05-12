-- 012 — Metadata AI per whatsapp_messages
-- Aggiunge campi popolati dall'AI categorize + transcribe (Groq free tier)

ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS detected_language TEXT,
  ADD COLUMN IF NOT EXISTS transcript_confidence FLOAT,
  ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN whatsapp_messages.detected_language IS 'Codice ISO della lingua rilevata (it, en, es, fr, ...). Null se non rilevata o non applicabile.';
COMMENT ON COLUMN whatsapp_messages.transcript_confidence IS 'Confidence 0-1 della trascrizione Whisper. Null per messaggi non audio.';
COMMENT ON COLUMN whatsapp_messages.ai_processed IS 'true se il messaggio è stato categorizzato da AI (Groq/Gemini), false se fallback rule-based.';

-- Optional index: filtrare messaggi che hanno avuto AI processing
CREATE INDEX IF NOT EXISTS idx_wa_messages_ai_processed
  ON whatsapp_messages(tenant_id, ai_processed)
  WHERE ai_processed;
