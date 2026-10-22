-- 035_grants_hardening.sql
-- Blindaje de permisos de Data API ante una reconstrucción del esquema desde cero
-- (recuperación, mudanza de proyecto, segundo entorno, `supabase db reset`,
-- preview branches).
--
-- CONTEXTO: a partir del 30/10/2026 Supabase deja de otorgar automáticamente el
-- acceso de Data API a las tablas NUEVAS del schema `public`. El proyecto ya se
-- protege en 017_grants.sql con un GRANT masivo + ALTER DEFAULT PRIVILEGES. Esta
-- migración agrega una red adicional: re-otorga explícitamente sobre TODAS las
-- tablas existentes al momento de correr. Así, un rebuild completo deja la API
-- accesible sin depender de que un único rol haya creado todas las tablas (que es
-- de lo que depende ALTER DEFAULT PRIVILEGES).
--
-- Importante:
--   - La RLS sigue filtrando filas. Esto solo habilita el acceso al schema/API,
--     igual que 017 (ver su comentario). No cambia la seguridad por fila.
--   - Es idempotente: se puede volver a correr sin efectos adversos.
--   - Convención a futuro: cada migración que cree una tabla nueva debería incluir
--     su propio GRANT (recomendación de Supabase), o re-correr este bloque al final.
--
-- NOTA PARA REVISIÓN (dev1): el número 035 asume que entra después de master (032)
-- y de las Edge Functions de Sprint 3 (033/034, PRs #53/#54). Si el orden de merge
-- cambia, renumerar.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Re-afirma el default para las tablas futuras (ya está en 017; redundante a propósito,
-- para que este archivo sea autosuficiente como "red de permisos").
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
