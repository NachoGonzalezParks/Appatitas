-- 007_service_areas.sql
-- Zonas de cobertura del proveedor como polígonos geográficos. Preparada para fases futuras.

CREATE TABLE service_areas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  area         GEOGRAPHY(POLYGON, 4326) NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_service_areas_area ON service_areas USING GIST (area);
