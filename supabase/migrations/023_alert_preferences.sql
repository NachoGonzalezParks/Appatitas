-- 023_alert_preferences.sql
-- Agrega columna alert_preferences a users para configurar alertas de salud (HU-009, GAP-010).
-- Estructura: { "vaccination": true, "deworming": true }

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS alert_preferences jsonb
    NOT NULL DEFAULT '{"vaccination": true, "deworming": true}'::jsonb;
