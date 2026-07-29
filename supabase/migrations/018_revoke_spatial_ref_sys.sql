-- 018_revoke_spatial_ref_sys.sql
-- spatial_ref_sys es una tabla del sistema de PostGIS (datos de referencia geográfica).
-- El GRANT ALL de 017 le dio acceso a anon/authenticated sin querer.
-- Se revoca el acceso público — las funciones ST_DWithin/ST_Transform siguen funcionando.

REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon, authenticated;
