# ADR-003: PostGIS para Geolocalización y Búsquedas por Proximidad
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado

---

## Context

El sistema requiere capacidades geoespaciales en tres módulos distintos:

1. **Búsqueda de Proveedores por proximidad (HU-016):** filtrar y ordenar Proveedores activos dentro de un radio configurable desde la ubicación del Tutor, usando la consulta `ST_DWithin(provider.location, tutor.location, radius_meters)`.
2. **Notificación masiva en mascota perdida (HU-012):** identificar todos los usuarios dentro de un radio de 5 KM de la última ubicación registrada de una mascota para disparar notificaciones push.
3. **Motor de coincidencias de mascotas encontradas (HU-014):** contrastar la ubicación de una mascota encontrada contra reportes de pérdida abiertos en un radio de 3 KM.

El SDD especifica explícitamente la función `ST_DWithin` de PostGIS como mecanismo de implementación para HU-016. Los radios son fijos para HU-012 (5 KM) y HU-014 (3 KM), y configurable por el usuario en HU-013 (5, 10 o 20 KM).

La plataforma base seleccionada (Supabase) incluye PostGIS como extensión disponible de PostgreSQL, sin costo adicional de infraestructura.

---

## Decision

Utilizar **PostGIS** como motor geoespacial, habilitado como extensión de PostgreSQL en Supabase.

**Decisión de diseño de tabla:** Centralizar todas las coordenadas en la tabla `locations` con columna de tipo `GEOGRAPHY(POINT)` (SDD v1.1, §Notas de versión). Esta tabla es referenciada por FK desde `users`/perfil de Tutor, `providers` y `lost_reports`.

**Consultas definidas por el SDD:**

| Módulo | Función PostGIS | Radio |
|---|---|---|
| Búsqueda de Proveedores (HU-016) | `ST_DWithin` + `ST_Distance` para ordenamiento | Configurable por Tutor |
| Notificación mascota perdida (HU-012) | `ST_DWithin` | 5 KM fijo |
| Motor de coincidencias (HU-014) | `ST_DWithin` | 3 KM fijo |
| Mapa comunitario (HU-013) | `ST_DWithin` | 5, 10 o 20 KM (selector usuario) |

**Tipo de dato:** Se usa `GEOGRAPHY` (en lugar de `GEOMETRY`) para que los cálculos de distancia operen en metros sobre la superficie terrestre real, lo que es correcto para los radios urbanos del ámbito de Córdoba, Argentina.

---

## Consequences

**Positivas:**
- PostGIS es el estándar de facto para geoespacial en PostgreSQL. `ST_DWithin` y `ST_Distance` cubren exactamente los casos de uso del SDD sin lógica adicional en la capa de aplicación.
- Al estar integrado en Supabase (ya adoptado en ADR-001), no requiere infraestructura separada ni licencias adicionales.
- La tabla `locations` centralizada (SDD v1.1) evita duplicación de columnas de coordenadas en múltiples tablas y facilita la indexación espacial en un único lugar.

**Negativas / Restricciones:**
- La tabla `service_areas` (SDD v1.1) usa `GEOGRAPHY(POLYGON)` para coberturas granulares futuras, pero la búsqueda actual de HU-016 usa el campo `radius_km` de `providers`. La coexistencia de ambos mecanismos genera ambigüedad sobre cuál prevalece. Ver GAP-013.
- Las consultas `ST_DWithin` sobre `GEOGRAPHY` requieren un índice espacial (GIST) en la columna de coordenadas para ser eficientes. Sin índice, el rendimiento degrada linealmente con el volumen de Proveedores o reportes.
- El cálculo de "raza aparente" en el motor de coincidencias de HU-014 no puede resolverse con PostGIS solo; PostGIS aporta el filtro geoespacial pero la evaluación de similitud de especie/raza/color requiere lógica adicional no especificada en el SDD (GAP-012).

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Cálculo de distancia en capa de aplicación (Haversine en código)** | Requiere traer todos los registros a memoria para filtrar por distancia. No escala con el volumen de Proveedores. PostGIS filtra en base de datos con índice espacial. |
| **Google Maps Distance Matrix API** | API externa de pago por llamada. Para búsquedas en tiempo real con múltiples Proveedores, el costo y la latencia son inviables. PostGIS opera localmente sobre los datos propios. |
| **Elasticsearch con geo_distance** | Infraestructura separada. Supabase ya incluye PostGIS; agregar Elasticsearch duplicaría la infraestructura sin beneficio adicional para el volumen esperado de Fase 1 y Fase 2 en Córdoba. |
