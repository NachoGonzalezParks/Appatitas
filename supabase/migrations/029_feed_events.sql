-- 029_feed_events.sql
-- Tabla feed_events para registrar eventos comunitarios (GAP-015, HU-015).
-- En Sprint 3 solo se inserta al cerrar un reporte. Sin UI de feed en este sprint.

CREATE TABLE IF NOT EXISTS public.feed_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el feed es comunitario).
CREATE POLICY "feed_events_select_public" ON public.feed_events
  FOR SELECT USING (true);

-- Solo Edge Functions con service_role pueden insertar (nunca el cliente directo).
-- No se define política INSERT para authenticated/anon: la Edge Function usa service_role.
