-- 030_rls_lost_reports.sql
-- RLS para lost_reports (Sprint 3).
--
-- Reglas:
--   SELECT: público (anon) — solo reportes activos (status = 'lost'). Admins ven todo.
--   INSERT: cualquier usuario autenticado o anónimo (user_id es nullable).
--   UPDATE: solo el propietario puede cambiar el status (cerrar su reporte).
--   DELETE: nunca (los reportes son permanentes para auditoría).

ALTER TABLE public.lost_reports ENABLE ROW LEVEL SECURITY;

-- Lectura pública de reportes activos (mapa comunitario, RN-015).
CREATE POLICY "lost_reports_select_public" ON public.lost_reports
  FOR SELECT USING (
    status = 'lost'
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- INSERT: autenticado o anónimo (user_id nullable).
CREATE POLICY "lost_reports_insert_any" ON public.lost_reports
  FOR INSERT WITH CHECK (true);

-- UPDATE: solo el propietario puede actualizar su propio reporte.
CREATE POLICY "lost_reports_update_own" ON public.lost_reports
  FOR UPDATE USING (
    user_id = auth.uid()
  );
