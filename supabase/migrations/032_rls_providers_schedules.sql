-- 032_rls_providers_schedules.sql
-- RLS para providers, service_areas y schedules (Sprint 4, Días 1-2).

-- ─── PROVIDERS ───────────────────────────────────────────────────────────────
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo de proveedores activos (onboarding_status = 'active').
-- El propietario puede ver su propio perfil en cualquier estado.
-- Admin ve todos.
DROP POLICY IF EXISTS "providers_select_public" ON public.providers;
CREATE POLICY "providers_select_public" ON public.providers
  FOR SELECT USING (
    onboarding_status = 'active'
    OR user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Solo el propietario puede crear su propio perfil.
DROP POLICY IF EXISTS "providers_insert_own" ON public.providers;
CREATE POLICY "providers_insert_own" ON public.providers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Solo el propietario puede editar su propio perfil.
DROP POLICY IF EXISTS "providers_update_own" ON public.providers;
CREATE POLICY "providers_update_own" ON public.providers
  FOR UPDATE USING (user_id = auth.uid());

-- ─── SERVICE_AREAS ───────────────────────────────────────────────────────────
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (necesaria para el mapa de búsqueda de Sprint 5).
DROP POLICY IF EXISTS "service_areas_select_public" ON public.service_areas;
CREATE POLICY "service_areas_select_public" ON public.service_areas
  FOR SELECT USING (true);

-- Solo el propietario del proveedor puede gestionar sus áreas.
DROP POLICY IF EXISTS "service_areas_insert_own" ON public.service_areas;
CREATE POLICY "service_areas_insert_own" ON public.service_areas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_areas.provider_id
        AND providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_areas_update_own" ON public.service_areas;
CREATE POLICY "service_areas_update_own" ON public.service_areas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_areas.provider_id
        AND providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_areas_delete_own" ON public.service_areas;
CREATE POLICY "service_areas_delete_own" ON public.service_areas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_areas.provider_id
        AND providers.user_id = auth.uid()
    )
  );

-- ─── SCHEDULES ───────────────────────────────────────────────────────────────
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar disponibilidad en el marketplace).
DROP POLICY IF EXISTS "schedules_select_public" ON public.schedules;
CREATE POLICY "schedules_select_public" ON public.schedules
  FOR SELECT USING (true);

-- Solo el propietario puede gestionar sus horarios.
DROP POLICY IF EXISTS "schedules_insert_own" ON public.schedules;
CREATE POLICY "schedules_insert_own" ON public.schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = schedules.provider_id
        AND providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "schedules_update_own" ON public.schedules;
CREATE POLICY "schedules_update_own" ON public.schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = schedules.provider_id
        AND providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "schedules_delete_own" ON public.schedules;
CREATE POLICY "schedules_delete_own" ON public.schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = schedules.provider_id
        AND providers.user_id = auth.uid()
    )
  );
