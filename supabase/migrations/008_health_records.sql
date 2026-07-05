-- 008_health_records.sql
-- Registro unificado de salud: vacunas, desparasitaciones y consultas clínicas.

CREATE TABLE health_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('vaccination', 'deworming', 'clinical_visit')),
  applied_date    DATE NOT NULL,
  next_due_date   DATE,
  frequency_days  INTEGER CHECK (frequency_days IN (15, 30, 60, 90, 180)),
  vaccine_type    TEXT,
  deworming_type  TEXT CHECK (deworming_type IN ('interna', 'externa', 'ambas')),
  vet_name        TEXT,
  batch_number    TEXT,
  visit_reason    TEXT,
  diagnosis       TEXT,
  treatment       TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_health_records_next_due ON health_records (next_due_date) WHERE next_due_date IS NOT NULL;
