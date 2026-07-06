-- 002_users.sql
-- Tabla central de identidad. El id lo provee Supabase Auth.

CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
