-- 016_indexes.sql
-- Índices de performance geoespacial y soporte. Fuente: database.md §5, SDD HU-012/HU-016.

-- Índice geoespacial principal sobre coordenadas (ya creado en 001, incluido aquí para referencia explícita)
-- CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);

-- Soporte para ST_DWithin en búsqueda de proveedores (HU-016)
CREATE INDEX idx_providers_location_id ON providers (location_id);

-- Soporte para ST_DWithin en notificaciones masivas por mascota perdida (HU-012)
CREATE INDEX idx_users_location_id ON users (location_id);

-- Soporte para búsquedas geoespaciales en reportes de pérdida (HU-013, HU-014)
CREATE INDEX idx_lost_reports_location_id ON lost_reports (location_id);

-- Soporte para filtro de reportes activos (status = 'lost') usado en HU-013
CREATE INDEX idx_lost_reports_status ON lost_reports (status);

-- Soporte para filtro de proveedores activos en búsquedas (HU-016)
CREATE INDEX idx_providers_status ON providers (status);

-- Soporte para el cron job diario de alertas de salud (HU-009)
-- Ya creado en 008, incluido aquí para tener todos los índices en un lugar visible
-- CREATE INDEX idx_health_records_next_due ON health_records (next_due_date) WHERE next_due_date IS NOT NULL;
