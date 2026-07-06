-- 011_bookings.sql
-- Reservas de turnos entre tutor y proveedor. Requerida desde MVP por HU-004.

CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  pet_id        UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending',
  scheduled_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
