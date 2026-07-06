-- 010_lost_reports.sql
-- Reportes de mascotas perdidas o encontradas en la vía pública.

CREATE TABLE lost_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  pet_id         UUID REFERENCES pets(id) ON DELETE SET NULL,
  type           TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  status         TEXT NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'closed')),
  photo_url      TEXT,
  name           TEXT NOT NULL,
  species        TEXT NOT NULL,
  breed          TEXT,
  color          TEXT,
  sex            TEXT,
  incident_date  DATE NOT NULL,
  location_id    UUID REFERENCES locations(id) ON DELETE SET NULL,
  behavior       TEXT,
  contact_phone  TEXT NOT NULL,
  reward_ars     NUMERIC,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
