-- 001_locations.sql
-- Tabla centralizada de geolocalización. Reutilizable por users, providers y lost_reports.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinates   GEOGRAPHY(POINT, 4326) NOT NULL,
  address       TEXT,
  neighborhood  TEXT,
  city          TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);
