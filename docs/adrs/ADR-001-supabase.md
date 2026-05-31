# ADR-001: Supabase como Plataforma Backend
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado

---

## Context

El proyecto requiere una plataforma backend capaz de cubrir simultáneamente:

- **Autenticación** con soporte OAuth 2.0 (Google, Facebook) y email/contraseña (HU-001, HU-005).
- **Base de datos relacional** con soporte geoespacial para búsquedas por proximidad (HU-016, HU-012, HU-014).
- **Almacenamiento de archivos** para fotos de mascotas, galerías de proveedores y adjuntos clínicos (HU-003, HU-006, HU-010).
- **Lógica serverless** para cron jobs de alertas de salud y motor de coincidencias (HU-009, HU-014).
- **Tiempo de desarrollo acotado:** equipo de 3 desarrolladores con duración estimada de 4 meses para Fase 1.

El equipo necesita reducir la cantidad de servicios independientes a integrar y mantener, priorizando una plataforma que concentre múltiples capacidades bajo una única API y modelo de seguridad.

---

## Decision

Adoptar **Supabase** como plataforma backend principal, utilizando los siguientes componentes:

| Componente Supabase | Uso en APPATITAS |
|---|---|
| **PostgreSQL** | Base de datos relacional principal |
| **PostGIS** (extensión) | Consultas geoespaciales `ST_DWithin` |
| **Supabase Auth** | Autenticación OAuth 2.0 + email/contraseña |
| **Supabase Storage** | Buckets `pets`, `providers`, adjuntos clínicos |
| **Supabase Edge Functions** | Cron diario de alertas de salud, motor de coincidencias, notificaciones push |

---

## Consequences

**Positivas:**
- Un único proveedor cubre auth, base de datos, storage y funciones serverless, reduciendo la complejidad operativa para un equipo de 3 personas.
- PostGIS está disponible de forma nativa en Supabase, habilitando `ST_DWithin` sin infraestructura adicional (HU-016, HU-012, HU-014).
- El UUID provisto por Supabase Auth se usa directamente como PK en la tabla `users`, simplificando la integración de identidad.
- Row Level Security (RLS) de PostgreSQL disponible nativamente para proteger datos entre usuarios.

**Negativas / Restricciones:**
- Dependencia fuerte con un único proveedor. Una interrupción de Supabase afecta autenticación, datos y funciones simultáneamente.
- Las Edge Functions tienen límites de tiempo de ejecución que deben validarse para el cron diario de HU-009 a medida que `health_records` crece.
- El costo de Supabase escala con el uso; requiere revisión en Fase 3 (expansión geográfica).

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Firebase (Google)** | No tiene soporte nativo de PostGIS ni SQL relacional estructurado. Inadecuado para consultas geoespaciales de HU-016. |
| **AWS (RDS + S3 + Lambda + Cognito)** | Cubre los requisitos técnicos pero implica integrar y operar 4+ servicios independientes, superando la capacidad operativa de 3 desarrolladores en 4 meses. |
| **Backend propio (Node.js + PostgreSQL)** | Mayor control pero mayor tiempo de desarrollo inicial. Implica construir auth, storage y funciones serverless desde cero, comprometiendo los plazos de Fase 1. |
