-- 017_grants.sql
-- Permisos base para los roles de Supabase (anon, authenticated, service_role).
-- Sin esto, PostgREST devuelve 403 aunque RLS esté configurado correctamente.
-- La RLS sigue filtrando filas — esto solo habilita el acceso al schema.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
