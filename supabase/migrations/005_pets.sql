-- 005_pets.sql
-- Perfil digital de mascota. Baja lógica con deleted_at (nunca se elimina físicamente).

CREATE TABLE pets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed       TEXT NOT NULL,
  birth_date  DATE,
  sex         TEXT,
  weight_kg   NUMERIC,
  color_marks TEXT,
  microchip_id TEXT,
  photo_url   TEXT,
  deleted_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
