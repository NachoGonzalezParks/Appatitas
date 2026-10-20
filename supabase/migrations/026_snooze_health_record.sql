-- 026_snooze_health_record.sql
-- RPC para posponer 7 días el vencimiento de un registro de salud (RN-007).
-- Valida que el registro pertenece al usuario autenticado antes de actualizar.

DROP FUNCTION IF EXISTS snooze_health_record(uuid);

CREATE OR REPLACE FUNCTION snooze_health_record(p_record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM health_records hr
    JOIN pets p ON p.id = hr.pet_id
    WHERE hr.id = p_record_id
      AND p.user_id = auth.uid()
      AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Registro no encontrado o no pertenece al usuario';
  END IF;

  UPDATE health_records
  SET next_due_date = next_due_date + INTERVAL '7 days',
      updated_at    = now()
  WHERE id = p_record_id;
END;
$$;
