-- 027_create_passport_share_rpc.sql
-- RPC para crear un share de pasaporte con hash seguro via pgcrypto (HU-011, RN-008).
-- Usa gen_random_bytes(32) en base64url en lugar de UUID para mayor entropía.

DROP FUNCTION IF EXISTS create_passport_share(uuid, integer);

CREATE OR REPLACE FUNCTION create_passport_share(p_pet_id uuid, p_duration_days integer DEFAULT 7)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash      text;
  v_share_id  uuid;
BEGIN
  -- Validar que la mascota pertenece al usuario y no está eliminada.
  IF NOT EXISTS (
    SELECT 1 FROM pets
    WHERE id = p_pet_id
      AND user_id = auth.uid()
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Mascota no encontrada o no pertenece al usuario';
  END IF;

  -- Validar duración (RN-008: máx 7 días).
  IF p_duration_days < 1 OR p_duration_days > 7 THEN
    RAISE EXCEPTION 'La duración debe ser entre 1 y 7 días';
  END IF;

  -- Generar hash seguro en base64url.
  v_hash := replace(replace(
    encode(extensions.gen_random_bytes(32), 'base64'),
    '+', '-'), '/', '_');
  v_hash := replace(v_hash, '=', '');

  INSERT INTO passport_shares (pet_id, hash, expires_at)
  VALUES (p_pet_id, v_hash, now() + (p_duration_days || ' days')::interval)
  RETURNING id INTO v_share_id;

  RETURN v_share_id;
END;
$$;
