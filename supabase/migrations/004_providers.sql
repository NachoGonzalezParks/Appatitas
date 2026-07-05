-- 004_providers.sql
-- Perfil comercial del proveedor de servicios.

CREATE TABLE providers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name     TEXT NOT NULL,
  description       TEXT CHECK (char_length(description) <= 500),
  categories        TEXT[] NOT NULL DEFAULT '{}',
  cuit_dni          TEXT,
  radius_km         NUMERIC,
  location_id       UUID REFERENCES locations(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active')),
  onboarding_status TEXT,
  billing_email     TEXT,
  payout_method     TEXT,
  rating_avg        NUMERIC DEFAULT 0,
  verified          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
