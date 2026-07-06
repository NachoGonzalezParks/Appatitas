-- 006_schedules.sql
-- Grilla semanal de disponibilidad del proveedor. 0=domingo, 6=sábado (convención PostgreSQL EXTRACT DOW).

CREATE TABLE schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed    BOOLEAN NOT NULL DEFAULT false,
  blocks       JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (provider_id, day_of_week)
);
