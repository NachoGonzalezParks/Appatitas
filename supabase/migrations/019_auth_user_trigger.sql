-- 019_auth_user_trigger.sql
-- Trigger de registro (S0-04 / HU-001): al crear un usuario en auth.users,
-- crea su fila en public.users y su rol en user_roles (RFC-002).
--
-- Contrato Dev2<->Dev3 (handoff D3-2): el rol viene en raw_user_meta_data->>'role',
-- que Dev2 envia en supabase.auth.signUp({ options: { data: { role } } }).
-- Roles validos por esta via: 'tutor' | 'provider'. 'admin' se asigna solo a mano
-- (RFC-002/003). Rol por defecto: 'tutor' (HU-001).
--
-- Autor: Ale (dev3, tarea S0-04 Auth). Requiere revision de Dev1 (migraciones/DB).

-- ─────────────────────────────────────────────
-- Alta: crea perfil + rol al registrarse
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tutor');
  IF v_role NOT IN ('tutor', 'provider') THEN
    v_role := 'tutor';  -- default HU-001; nunca 'admin' por esta via
  END IF;

  INSERT INTO public.users (id, email, email_verified)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- Confirmacion de email: sincroniza email_verified (RN-004)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users SET email_verified = true, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmed();
