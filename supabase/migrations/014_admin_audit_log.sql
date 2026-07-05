-- 014_admin_audit_log.sql
-- Registro inmutable de acciones del administrador. Solo INSERT, nunca UPDATE ni DELETE.

CREATE TABLE admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  target_table  TEXT NOT NULL,
  target_id     UUID NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
