-- 034_matches_for_found_report.sql
-- RPC para HU-014 (motor de coincidencias de mascota encontrada, RN-014, GAP-012).
--
-- Dado un reporte 'found', devuelve los reportes 'lost' compatibles junto con las
-- suscripciones push de sus dueños, para avisarles. Criterio (GAP-012):
--   - species: coincidencia EXACTA.
--   - color:   coincidencia PARCIAL (ILIKE). breed queda para una mejora futura.
--   - distancia: dentro de 3 km (ST_DWithin sobre geography, en metros).
-- La usa la Edge Function found-pet-match.
--
-- Escrita por dev3 para su Edge Function; a revisar por dev1 (capa de datos).

CREATE OR REPLACE FUNCTION public.matches_for_found_report(
  p_found_id uuid,
  p_radius_m integer DEFAULT 3000,
  p_limit    integer DEFAULT 500
)
RETURNS TABLE (
  lost_report_id uuid,
  lost_name      text,
  distance_m     double precision,
  endpoint       text,
  p256dh         text,
  auth           text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lr.id,
         lr.name,
         ST_Distance(ll.coordinates, fl.coordinates) AS distance_m,
         ps.endpoint, ps.p256dh, ps.auth
  FROM lost_reports fr                                   -- el reporte encontrado
  JOIN locations fl ON fl.id = fr.location_id
  JOIN lost_reports lr                                   -- candidatos perdidos
    ON lr.status = 'lost' AND lr.type = 'lost'
  JOIN locations ll ON ll.id = lr.location_id
  JOIN users u ON u.id = lr.user_id                      -- inner: descarta perdidas anónimas (sin dueño que avisar)
  JOIN push_subscriptions ps ON ps.user_id = u.id
  WHERE fr.id = p_found_id
    AND fr.type = 'found'
    AND (fr.user_id IS NULL OR lr.user_id <> fr.user_id) -- no auto-coincidencia
    AND lr.species = fr.species                          -- exacto (GAP-012)
    AND (fr.color IS NULL OR lr.color ILIKE '%' || fr.color || '%') -- parcial
    AND ST_DWithin(ll.coordinates, fl.coordinates, p_radius_m)
  ORDER BY distance_m
  LIMIT p_limit;
$$;

-- Solo la Edge Function (service_role) puede ejecutarla; nunca el cliente.
REVOKE ALL ON FUNCTION public.matches_for_found_report(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.matches_for_found_report(uuid, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.matches_for_found_report(uuid, integer, integer) TO service_role;
