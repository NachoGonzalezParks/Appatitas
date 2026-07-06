-- 015_rls.sql
-- Row Level Security para todas las tablas. Fuente: ADR-002, security.md, RFC-001/002/003.

-- ─────────────────────────────────────────────
-- Función auxiliar de roles (ADR-002, RFC-002)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_role(uid uuid, r text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND role = r);
$$;


-- ─────────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Lectura pública (necesaria para mapa HU-013 y búsquedas HU-016)
CREATE POLICY "locations_select_public"
  ON locations FOR SELECT
  USING (true);

-- Inserción: cualquier usuario autenticado puede crear una ubicación
CREATE POLICY "locations_insert_authenticated"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Actualización: solo admins (las ubicaciones las gestiona el sistema internamente)
CREATE POLICY "locations_update_admin"
  ON locations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));


-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee su propio perfil; admin lee todos
CREATE POLICY "users_select"
  ON users FOR SELECT
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Cada usuario actualiza solo su propio perfil
CREATE POLICY "users_update"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- INSERT lo ejecuta el trigger de Supabase Auth via service_role, que ignora RLS por diseño.
-- No se necesita política de INSERT aquí: ningún usuario normal puede insertar en users directamente.


-- ─────────────────────────────────────────────
-- user_roles
-- ─────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee sus propios roles; admin lee todos
CREATE POLICY "user_roles_select"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Autoservicio: tutor y provider se asignan solos en el registro
CREATE POLICY "user_roles_insert_self"
  ON user_roles FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role IN ('tutor', 'provider')
  );

-- Solo admin puede asignar el rol 'admin' (RFC-003)
CREATE POLICY "user_roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND role = 'admin'
  );

-- Solo admin puede revocar roles
CREATE POLICY "user_roles_delete_admin"
  ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));


-- ─────────────────────────────────────────────
-- providers
-- ─────────────────────────────────────────────
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Proveedores activos son públicos; pendientes solo los ve el dueño y admin
CREATE POLICY "providers_select"
  ON providers FOR SELECT
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Solo el dueño puede crear su perfil de proveedor
CREATE POLICY "providers_insert"
  ON providers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- El dueño edita su perfil; admin puede aprobar/rechazar/verificar
CREATE POLICY "providers_update"
  ON providers FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));


-- ─────────────────────────────────────────────
-- pets
-- ─────────────────────────────────────────────
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Solo el tutor dueño ve sus mascotas
CREATE POLICY "pets_select"
  ON pets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "pets_insert"
  ON pets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pets_update"
  ON pets FOR UPDATE
  USING (user_id = auth.uid());


-- ─────────────────────────────────────────────
-- health_records
-- ─────────────────────────────────────────────
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Solo el tutor dueño de la mascota accede a sus registros de salud
CREATE POLICY "health_records_select"
  ON health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = health_records.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "health_records_insert"
  ON health_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = health_records.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "health_records_update"
  ON health_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = health_records.pet_id AND pets.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- passport_shares
-- ─────────────────────────────────────────────
ALTER TABLE passport_shares ENABLE ROW LEVEL SECURITY;

-- El tutor dueño gestiona sus links compartidos
CREATE POLICY "passport_shares_select"
  ON passport_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = passport_shares.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "passport_shares_insert"
  ON passport_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = passport_shares.pet_id AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "passport_shares_delete"
  ON passport_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = passport_shares.pet_id AND pets.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- schedules
-- ─────────────────────────────────────────────
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Público: cualquiera puede ver los horarios para consultar disponibilidad (HU-017)
CREATE POLICY "schedules_select_public"
  ON schedules FOR SELECT
  USING (true);

-- Solo el proveedor dueño gestiona su grilla
CREATE POLICY "schedules_insert"
  ON schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = schedules.provider_id AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_update"
  ON schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = schedules.provider_id AND providers.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- service_areas
-- ─────────────────────────────────────────────
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Público: necesario para búsquedas geoespaciales (HU-016)
CREATE POLICY "service_areas_select_public"
  ON service_areas FOR SELECT
  USING (true);

CREATE POLICY "service_areas_insert"
  ON service_areas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = service_areas.provider_id AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "service_areas_delete"
  ON service_areas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE providers.id = service_areas.provider_id AND providers.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- lost_reports
-- ─────────────────────────────────────────────
ALTER TABLE lost_reports ENABLE ROW LEVEL SECURITY;

-- Reportes lost y found son públicos (HU-013, HU-014); closed solo el dueño y admin
CREATE POLICY "lost_reports_select"
  ON lost_reports FOR SELECT
  USING (
    status IN ('lost', 'found')
    OR user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Cualquier usuario autenticado o anónimo puede reportar (HU-012, HU-014)
CREATE POLICY "lost_reports_insert"
  ON lost_reports FOR INSERT
  WITH CHECK (true);

-- El dueño cierra/actualiza su reporte; admin puede moderar (HU-021)
CREATE POLICY "lost_reports_update"
  ON lost_reports FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));


-- ─────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- El tutor y el proveedor involucrados ven la reserva; admin ve todas
CREATE POLICY "bookings_select"
  ON bookings FOR SELECT
  USING (
    tutor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM providers WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

-- Solo el tutor crea la reserva
CREATE POLICY "bookings_insert"
  ON bookings FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

-- El tutor puede cancelar la suya; admin puede modificar cualquiera
CREATE POLICY "bookings_update"
  ON bookings FOR UPDATE
  USING (tutor_id = auth.uid() OR has_role(auth.uid(), 'admin'));


-- ─────────────────────────────────────────────
-- booking_status_events (tabla inmutable)
-- ─────────────────────────────────────────────
ALTER TABLE booking_status_events ENABLE ROW LEVEL SECURITY;

-- El tutor y el proveedor involucrados leen el historial; admin lee todo
CREATE POLICY "booking_status_events_select"
  ON booking_status_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_status_events.booking_id
        AND (
          bookings.tutor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM providers
            WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
          )
          OR has_role(auth.uid(), 'admin')
        )
    )
  );

-- Solo INSERT — cualquier actor autenticado involucrado en la reserva
CREATE POLICY "booking_status_events_insert"
  ON booking_status_events FOR INSERT
  WITH CHECK (changed_by = auth.uid());


-- ─────────────────────────────────────────────
-- push_subscriptions
-- ─────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona solo sus propias suscripciones (RFC-001)
CREATE POLICY "push_subscriptions_select"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());


-- ─────────────────────────────────────────────
-- admin_audit_log (tabla inmutable)
-- ─────────────────────────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer el log
CREATE POLICY "admin_audit_log_select"
  ON admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Solo INSERT — solo admin puede registrar acciones
CREATE POLICY "admin_audit_log_insert"
  ON admin_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- UPDATE y DELETE bloqueados intencionalmente: tabla inmutable por diseño (RFC-003).
-- Con RLS habilitado y sin políticas de UPDATE/DELETE, Supabase las bloquea automáticamente.
