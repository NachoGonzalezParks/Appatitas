-- 021_soft_delete_pet.sql
-- Función RPC para baja lógica de mascota.
-- Ejecuta en una sola transacción atómica:
--   1. Marca la mascota como eliminada (deleted_at = now())
--   2. Cancela todos sus turnos futuros pendientes/confirmados
-- Si cualquier paso falla, se revierte todo (rollback automático).
-- Solo el tutor dueño de la mascota puede ejecutarla (validado por RLS).

CREATE OR REPLACE FUNCTION soft_delete_pet(pet_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que la mascota pertenece al usuario que llama
  IF NOT EXISTS (
    SELECT 1 FROM pets
    WHERE id = pet_id
      AND user_id = auth.uid()
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Mascota no encontrada o no pertenece al usuario';
  END IF;

  -- 1. Baja lógica de la mascota
  UPDATE pets
  SET deleted_at = now()
  WHERE id = pet_id;

  -- 2. Cancelar turnos futuros (no falla si no hay reservas)
  UPDATE bookings
  SET status = 'cancelled_by_tutor',
      updated_at = now()
  WHERE pet_id = soft_delete_pet.pet_id
    AND scheduled_at > now()
    AND status NOT IN ('cancelled_by_tutor', 'completed');
END;
$$;
