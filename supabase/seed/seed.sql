-- seed.sql — Datos de prueba para staging
-- UUIDs fijos para poder referenciarlos entre tablas.
-- IMPORTANTE: correr solo en staging, nunca en producción.

-- ─────────────────────────────────────────────
-- Limpiar datos previos (en orden inverso a FK)
-- ─────────────────────────────────────────────
TRUNCATE TABLE
  admin_audit_log,
  push_subscriptions,
  booking_status_events,
  bookings,
  lost_reports,
  passport_shares,
  health_records,
  service_areas,
  schedules,
  pets,
  providers,
  user_roles,
  users,
  locations
CASCADE;

-- ─────────────────────────────────────────────
-- Locations
-- ─────────────────────────────────────────────
INSERT INTO locations (id, coordinates, address, neighborhood, city) VALUES
  ('11111111-0000-0000-0000-000000000001', ST_GeogFromText('SRID=4326;POINT(-58.3816 -34.6037)'), 'Av. Corrientes 1234', 'San Nicolás',    'Buenos Aires'),
  ('11111111-0000-0000-0000-000000000002', ST_GeogFromText('SRID=4326;POINT(-58.4370 -34.5992)'), 'Av. Santa Fe 3456',  'Palermo',         'Buenos Aires'),
  ('11111111-0000-0000-0000-000000000003', ST_GeogFromText('SRID=4326;POINT(-58.3962 -34.6083)'), 'Defensa 567',        'San Telmo',       'Buenos Aires');

-- ─────────────────────────────────────────────
-- Users (el id debe coincidir con auth.users en staging)
-- Para tests locales usamos UUIDs conocidos.
-- ─────────────────────────────────────────────
INSERT INTO users (id, email, email_verified, full_name, phone, location_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'tutor1@test.com',    true,  'Laura García',    '+5491112345678', '11111111-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'tutor2@test.com',    true,  'Marcos Rodríguez','+5491187654321', '11111111-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'provider1@test.com', true,  'Veterinaria Palermo SRL', null,    '11111111-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'admin@test.com',     true,  'Admin Appatitas', null,            null);

-- ─────────────────────────────────────────────
-- User roles
-- ─────────────────────────────────────────────
INSERT INTO user_roles (user_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'tutor'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'tutor'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'provider'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'admin');

-- ─────────────────────────────────────────────
-- Providers
-- ─────────────────────────────────────────────
INSERT INTO providers (id, user_id, business_name, description, categories, radius_km, location_id, status, verified) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Veterinaria Palermo',
    'Atención veterinaria integral para perros y gatos. Turnos online.',
    ARRAY['veterinaria', 'peluquería'],
    5,
    '11111111-0000-0000-0000-000000000002',
    'active',
    true
  );

-- ─────────────────────────────────────────────
-- Schedules (lunes a viernes 9-18, sábado 9-13, domingo cerrado)
-- ─────────────────────────────────────────────
INSERT INTO schedules (provider_id, day_of_week, is_closed, blocks) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 0, true,  '[]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 1, false, '[{"from":"09:00","to":"18:00"}]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 2, false, '[{"from":"09:00","to":"18:00"}]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 3, false, '[{"from":"09:00","to":"18:00"}]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 4, false, '[{"from":"09:00","to":"18:00"}]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 5, false, '[{"from":"09:00","to":"18:00"}]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 6, false, '[{"from":"09:00","to":"13:00"}]');

-- ─────────────────────────────────────────────
-- Pets
-- ─────────────────────────────────────────────
INSERT INTO pets (id, user_id, name, species, breed, birth_date, sex, weight_kg, color_marks, microchip_id) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Luna',  'perro', 'Labrador',          '2021-03-15', 'hembra', 25.5, 'Pelaje dorado, mancha blanca en pecho', '956000012345678'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Michi', 'gato',  'Mestizo',           '2022-07-01', 'macho',   4.2, 'Gris atigrado',                         null),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Rocky', 'perro', 'Golden Retriever',  '2020-11-20', 'macho',  32.0, 'Pelaje caramelo',                       '956000087654321');

-- ─────────────────────────────────────────────
-- Health records
-- ─────────────────────────────────────────────
INSERT INTO health_records (pet_id, type, applied_date, next_due_date, frequency_days, vaccine_type, vet_name) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'vaccination',    '2024-01-10', '2025-01-10', 365, 'Séptuplecanina',  'Dr. Fernández'),
  ('cccccccc-0000-0000-0000-000000000001', 'deworming',      '2024-03-01', '2024-06-01',  90, null,              'Dr. Fernández'),
  ('cccccccc-0000-0000-0000-000000000001', 'clinical_visit', '2024-06-15', null,         null, null,             'Dr. Fernández'),
  ('cccccccc-0000-0000-0000-000000000003', 'vaccination',    '2024-02-20', '2025-02-20', 365, 'Séptuplecanina',  'Dra. López');

-- ─────────────────────────────────────────────
-- Passport shares (link de prueba — expira en 2030)
-- ─────────────────────────────────────────────
INSERT INTO passport_shares (pet_id, hash, expires_at) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'test-hash-luna-abc123', '2030-01-01T00:00:00Z');

-- ─────────────────────────────────────────────
-- Lost reports
-- ─────────────────────────────────────────────
INSERT INTO lost_reports (user_id, pet_id, type, status, name, species, breed, color, sex, incident_date, location_id, contact_phone, reward_ars) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000003',
    'lost', 'lost',
    'Rocky', 'perro', 'Golden Retriever', 'Caramelo', 'macho',
    '2024-07-01',
    '11111111-0000-0000-0000-000000000003',
    '+5491187654321',
    50000
  ),
  (
    null, null,
    'found', 'found',
    'Sin nombre', 'gato', 'Siamés', 'Blanco con manchas grises', 'macho',
    '2024-07-03',
    '11111111-0000-0000-0000-000000000001',
    '+5491155554444',
    null
  );

-- ─────────────────────────────────────────────
-- Bookings
-- ─────────────────────────────────────────────
INSERT INTO bookings (id, tutor_id, provider_id, pet_id, status, scheduled_at) VALUES
  (
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'confirmed',
    '2024-08-15T10:00:00-03:00'
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'pending',
    '2024-08-16T14:00:00-03:00'
  );

-- ─────────────────────────────────────────────
-- Booking status events
-- ─────────────────────────────────────────────
INSERT INTO booking_status_events (booking_id, from_status, to_status, changed_by) VALUES
  ('dddddddd-0000-0000-0000-000000000001', null,      'pending',   'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000001', 'pending', 'confirmed', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('dddddddd-0000-0000-0000-000000000002', null,      'pending',   'aaaaaaaa-0000-0000-0000-000000000002');

-- ─────────────────────────────────────────────
-- Admin audit log
-- ─────────────────────────────────────────────
INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, metadata) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'approve_provider',
    'providers',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '{"note": "Documentación verificada correctamente"}'
  );
