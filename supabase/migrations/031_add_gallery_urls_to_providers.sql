-- 031_add_gallery_urls_to_providers.sql
-- Agrega gallery_urls TEXT[] a providers para la galería de portfolio (HU-006, RN-018).
-- Máx. 10 fotos por proveedor validado a nivel de base de datos.

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS gallery_urls text[]
    NOT NULL DEFAULT '{}'::text[]
    CHECK (array_length(gallery_urls, 1) IS NULL OR array_length(gallery_urls, 1) <= 10);
