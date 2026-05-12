-- 013 — Photo analysis metadata
-- Llama Vision (Groq) analizza le foto WhatsApp dei clienti e salva i risultati
-- come JSONB nella colonna photo_analysis. Esempio:
--   { "garment_type": "giacca", "colors": ["blu navy"], "pattern": "spigato",
--     "details": ["revers a punta", "due bottoni"], "description": "Giacca formale blu navy spigato" }

ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS photo_analysis JSONB;

COMMENT ON COLUMN whatsapp_messages.photo_analysis IS
  'Analisi vision AI (Llama Vision via Groq) per foto/immagini. Null per messaggi non immagine o quando AI non disponibile.';

-- GIN index per future query "tutti i messaggi con tipo capo = giacca"
CREATE INDEX IF NOT EXISTS idx_wa_messages_photo_analysis
  ON whatsapp_messages USING GIN (photo_analysis)
  WHERE photo_analysis IS NOT NULL;
