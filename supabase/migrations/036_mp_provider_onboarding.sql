-- 036_mp_provider_onboarding.sql
-- Soporte para el onboarding de Mercado Pago de proveedores (HU-005 · RN-002).
-- La usa la Edge Function mp-provider-onboarding.
--
-- Escrita por dev3 para su Edge Function; a revisar por dev1 (capa de datos).

-- 1) id de vendedor en MP (no sensible: el proveedor dueño puede verlo).
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS mp_user_id text;

-- 2) Credenciales de MP del proveedor. SENSIBLE: permite mover la plata del
--    proveedor, así que SOLO las Edge Functions (service_role) acceden. El cliente
--    NUNCA lee ni escribe esta tabla.
CREATE TABLE IF NOT EXISTS public.provider_mp_credentials (
  provider_id   uuid PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  mp_user_id    text NOT NULL,
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_mp_credentials ENABLE ROW LEVEL SECURITY;
-- Sin políticas para anon/authenticated => el cliente no puede leer ni escribir
-- (RLS niega todo sin policy). service_role ignora RLS por diseño.
-- Defensa en profundidad: revocamos los grants de API (anula el GRANT por defecto
-- que aplican 017/035, para que esta tabla NO quede expuesta en la Data API).
REVOKE ALL ON public.provider_mp_credentials FROM anon, authenticated;

-- 3) Estados del OAuth: anti-CSRF + correlacionar qué proveedor está conectando.
--    Vencen a los 10 min (la vida del código de autorización de MP).
CREATE TABLE IF NOT EXISTS public.mp_oauth_states (
  state        text PRIMARY KEY,
  provider_id  uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.mp_oauth_states ENABLE ROW LEVEL SECURITY;
-- Igual que arriba: solo las Edge Functions (service_role) la usan.
REVOKE ALL ON public.mp_oauth_states FROM anon, authenticated;
