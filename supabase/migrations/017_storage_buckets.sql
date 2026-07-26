-- 017_storage_buckets.sql
-- Buckets de Supabase Storage y sus políticas de acceso (S0-05).
-- Fuente: docs/sprint-0-plan.md §2.4 · docs/architecture/database.md §4 ·
--         docs/system-architecture.md §5.1 (convención de rutas).
--
-- Autor: dev3 (tarea S0-05, Storage). Como toca RLS/seguridad, requiere revisión
-- de Dev1 (dominio de migraciones y seguridad).
--
-- Convención de rutas (system-architecture §5.1). La RLS usa el PRIMER segmento
-- de la ruta como identificador del dueño:
--   avatars/{user_id}/avatar.{ext}
--   pets/{user_id}/{pet_id}/photo.{ext}
--   providers/{provider_id}/gallery/*.{ext}
--   health-records/{pet_id}/{record_id}/*.{pdf|img}

-- ─────────────────────────────────────────────
-- Buckets
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',        'avatars',        true,  NULL,    NULL),                                          -- HU-002
  ('pets',           'pets',           false, NULL,    NULL),                                          -- HU-003 (1 foto)
  ('providers',      'providers',      true,  NULL,    NULL),                                          -- HU-006 (máx 6, se valida en app)
  ('health-records', 'health-records', false, 5242880, ARRAY['application/pdf','image/png','image/jpeg']) -- HU-010 (3 archivos, 5 MB c/u, RN-023)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- RLS de storage.objects por bucket
-- (storage.objects ya viene con RLS habilitada en Supabase)
-- ─────────────────────────────────────────────

-- avatars: lectura pública (HU-002), escritura solo del propio usuario.
CREATE POLICY "avatars_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_write_own"
  ON storage.objects FOR ALL
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- providers: lectura pública (visible en búsquedas HU-016), escritura solo del
-- Proveedor dueño (primer segmento = providers.id cuyo user_id = quien sube).
CREATE POLICY "providers_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'providers');

CREATE POLICY "providers_write_own"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'providers'
    AND EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id::text = (storage.foldername(name))[1] AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'providers'
    AND EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id::text = (storage.foldername(name))[1] AND p.user_id = auth.uid()
    )
  );

-- pets: privado. Solo el Tutor dueño (primer segmento = su user_id) lee y escribe.
-- NOTA(equipo): HU-011 comparte el pasaporte públicamente (sin sesión). El acceso
-- público a la foto se resolverá en Sprint 2 con URLs firmadas (o revisando si este
-- bucket pasa a público). Se deja privado por defecto (más seguro).
CREATE POLICY "pets_rw_own"
  ON storage.objects FOR ALL
  USING (bucket_id = 'pets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'pets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- health-records: privado. Solo el Tutor dueño de la mascota (primer segmento =
-- pets.id cuyo user_id = quien accede) lee y escribe (HU-010).
CREATE POLICY "health_records_rw_own"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'health-records'
    AND EXISTS (
      SELECT 1 FROM pets pe
      WHERE pe.id::text = (storage.foldername(name))[1] AND pe.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'health-records'
    AND EXISTS (
      SELECT 1 FROM pets pe
      WHERE pe.id::text = (storage.foldername(name))[1] AND pe.user_id = auth.uid()
    )
  );
