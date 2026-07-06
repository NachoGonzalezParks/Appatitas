-- 013_push_subscriptions.sql
-- Suscripciones Web Push por dispositivo. Un usuario puede tener varios dispositivos.

CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
