-- 012_booking_status_events.sql
-- Auditoría inmutable de cambios de estado de reservas. Solo INSERT, nunca UPDATE ni DELETE.

CREATE TABLE booking_status_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  changed_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
