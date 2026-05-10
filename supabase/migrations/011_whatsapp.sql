-- ─── WhatsApp Business Integration ──────────────────────────────────────────

-- Category enum
CREATE TYPE whatsapp_category AS ENUM (
  'misura',
  'ispirazione',
  'riferimento_dettaglio',
  'richiesta',
  'approvazione',
  'altro'
);

-- Message type enum
CREATE TYPE whatsapp_msg_type AS ENUM (
  'text',
  'image',
  'audio',
  'document',
  'video',
  'sticker'
);

-- Per-tenant WhatsApp configuration
ALTER TABLE tenants ADD COLUMN whatsapp_phone_number_id TEXT;

-- WhatsApp messages received
CREATE TABLE whatsapp_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id          UUID REFERENCES clients(id) ON DELETE SET NULL,
  -- WhatsApp identifiers
  wa_message_id      TEXT NOT NULL UNIQUE,
  wa_phone_number_id TEXT NOT NULL,
  from_phone         TEXT NOT NULL,
  from_name          TEXT,
  -- Content
  message_type       whatsapp_msg_type NOT NULL DEFAULT 'text',
  body               TEXT,
  media_url          TEXT,
  media_mime_type    TEXT,
  -- Classification
  category           whatsapp_category NOT NULL DEFAULT 'altro',
  category_summary   TEXT,
  -- Status
  is_read            BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at            TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_wa_messages_tenant  ON whatsapp_messages(tenant_id);
CREATE INDEX idx_wa_messages_client  ON whatsapp_messages(client_id);
CREATE INDEX idx_wa_messages_unread  ON whatsapp_messages(tenant_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_wa_messages_phone   ON whatsapp_messages(tenant_id, from_phone);
CREATE INDEX idx_wa_messages_sent    ON whatsapp_messages(tenant_id, sent_at DESC);

-- RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_owner full access" ON whatsapp_messages
  FOR ALL USING (is_platform_owner());

CREATE POLICY "tenant members read own" ON whatsapp_messages
  FOR SELECT USING (tenant_id = my_tenant_id());

CREATE POLICY "tenant members insert own" ON whatsapp_messages
  FOR INSERT WITH CHECK (tenant_id = my_tenant_id());

CREATE POLICY "tenant members update own" ON whatsapp_messages
  FOR UPDATE USING (tenant_id = my_tenant_id());
