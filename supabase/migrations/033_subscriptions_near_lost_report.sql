-- 033_subscriptions_near_lost_report.sql
-- RPC para HU-012 (aviso masivo de mascota perdida, RN-012).
--
-- Devuelve las suscripciones Web Push de los tutores cuya ubicación está dentro
-- de un radio del reporte. La usa la Edge Function lost-pet-notify.
-- ST_DWithin opera sobre geography (locations.coordinates) en METROS, apoyado en
-- el índice GIST (migración 016). Excluye al propio reportante y limita la cantidad
-- de destinatarios (throttle GAP-011).
--
-- Escrita por dev3 para su Edge Function; a revisar por dev1 (capa de datos).

CREATE OR REPLACE FUNCTION public.subscriptions_near_lost_report(
  p_report_id uuid,
  p_radius_m  integer DEFAULT 5000,
  p_limit     integer DEFAULT 500
)
RETURNS TABLE (endpoint text, p256dh text, auth text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM lost_reports lr
  JOIN locations rl ON rl.id = lr.location_id
  CROSS JOIN users u
  JOIN locations ul ON ul.id = u.location_id          -- inner join: descarta users sin ubicación
  JOIN push_subscriptions ps ON ps.user_id = u.id
  WHERE lr.id = p_report_id
    AND (lr.user_id IS NULL OR u.id <> lr.user_id)     -- no notificar al que reportó
    AND ST_DWithin(ul.coordinates, rl.coordinates, p_radius_m)
  ORDER BY ul.coordinates <-> rl.coordinates           -- más cercanos primero (KNN)
  LIMIT p_limit;
$$;

-- Solo la Edge Function (service_role) puede ejecutarla; nunca el cliente.
REVOKE ALL ON FUNCTION public.subscriptions_near_lost_report(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.subscriptions_near_lost_report(uuid, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscriptions_near_lost_report(uuid, integer, integer) TO service_role;
