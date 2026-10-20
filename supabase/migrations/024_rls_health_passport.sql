-- 024_rls_health_passport.sql
-- RLS para health_records y passport_shares (Sprint 2).

-- ─── HEALTH_RECORDS ──────────────────────────────────────────────────────────
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- El tutor solo ve registros de sus propias mascotas (no eliminadas).
CREATE POLICY "health_records_select_own" ON public.health_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = health_records.pet_id
        AND pets.user_id = auth.uid()
        AND pets.deleted_at IS NULL
    )
  );

CREATE POLICY "health_records_insert_own" ON public.health_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = health_records.pet_id
        AND pets.user_id = auth.uid()
        AND pets.deleted_at IS NULL
    )
  );

CREATE POLICY "health_records_update_own" ON public.health_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = health_records.pet_id
        AND pets.user_id = auth.uid()
        AND pets.deleted_at IS NULL
    )
  );

CREATE POLICY "health_records_delete_own" ON public.health_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = health_records.pet_id
        AND pets.user_id = auth.uid()
        AND pets.deleted_at IS NULL
    )
  );

-- ─── PASSPORT_SHARES ─────────────────────────────────────────────────────────
ALTER TABLE public.passport_shares ENABLE ROW LEVEL SECURITY;

-- El tutor gestiona sus propios shares.
CREATE POLICY "passport_shares_select_own" ON public.passport_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = passport_shares.pet_id
        AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "passport_shares_insert_own" ON public.passport_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = passport_shares.pet_id
        AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "passport_shares_delete_own" ON public.passport_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = passport_shares.pet_id
        AND pets.user_id = auth.uid()
    )
  );

-- Acceso público (anon) al pasaporte compartido: solo si no expiró (RN-009).
CREATE POLICY "passport_shares_read_public" ON public.passport_shares
  FOR SELECT USING (expires_at > now());
