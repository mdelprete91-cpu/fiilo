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
