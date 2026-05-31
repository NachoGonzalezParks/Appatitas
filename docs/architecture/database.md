# Arquitectura de Base de Datos — APPATITAS
**Versión:** 1.0
**Fuente:** `docs/SDD_MASTER.md` v1.1
**Motor:** PostgreSQL + PostGIS (via Supabase)
**Fecha:** Mayo 2025

Este documento describe el diseño de base de datos derivado estrictamente del SDD_MASTER. No se documenta ninguna tabla ni campo que no esté referenciado en dicho documento.

---

## 1. Principios de Diseño

Establecidos o inferidos directamente del SDD v1.1:

1. **Geolocalización centralizada:** La tabla `locations` es reutilizable por todas las entidades que requieran coordenadas geográficas. Evita duplicación de columnas de ubicación.
2. **Eliminación lógica:** Las entidades críticas nunca se eliminan físicamente. Se usa `deleted_at TIMESTAMP` como marcador de baja.
3. **Auditoría de estados de reserva:** Los cambios de estado en `bookings` se registran en la tabla `booking_status_events` para trazabilidad completa.
4. **Cobertura granular preparada:** La tabla `service_areas` existe para definir polígonos de cobertura de Proveedores en fases futuras, aunque en Fase 1 el campo `radius_km` en `providers` es la referencia operativa.

---

## 2. Diagrama de Entidades (relacional)

```
users
  └──< providers          (un user puede ser proveedor)
  └──< pets               (un user/tutor puede tener muchas mascotas)

providers
  └──< schedules          (un proveedor tiene grilla semanal)
  └──< service_areas      (un proveedor puede tener múltiples zonas)
  └── locations           (FK: ubicación del proveedor)

pets
  └──< health_records     (una mascota tiene muchos registros de salud)
  └──< passport_shares    (una mascota puede tener múltiples enlaces compartidos)
  └──< bookings           (una mascota puede tener múltiples reservas)

bookings
  └──< booking_status_events  (auditoría de transiciones de estado)

lost_reports
  └── locations           (FK: última ubicación de la mascota)

locations                 (tabla compartida, referenciada por FK desde múltiples tablas)
```

---

## 3. Tablas

### 3.1 `users`
Tabla central de identidad. Creada automáticamente al completar el flujo de registro (HU-001, HU-005).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK, generado por Supabase Auth |
| `email` | TEXT | Único en el sistema (RN-005) |
| `role` | TEXT | Valores: `tutor`, `provider`, `admin` |
| `email_verified` | BOOLEAN | Verificación obligatoria antes de acceso completo (RN-004) |
| `created_at` | TIMESTAMP | Fecha de registro |
| `updated_at` | TIMESTAMP | Última modificación |

**Notas:**
- El campo `role` define el tipo de actor. Ver GAP-004 en `docs/GAP_ANALYSIS.md` para la ambigüedad de roles múltiples.
- `id` es provisto directamente por Supabase Auth.

---

### 3.2 `providers`
Perfil comercial del Proveedor. Enriquecido en SDD v1.1 (HU-005, HU-006).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `business_name` | TEXT | Nombre del negocio (requerido) |
| `description` | TEXT | Máx. 500 caracteres |
| `categories` | TEXT[] | Selector múltiple: Peluquería, Paseos, Guardería, Veterinaria, Adiestramiento |
| `cuit_dni` | TEXT | Para validación diferida por Admin |
| `radius_km` | NUMERIC | Radio de cobertura declarado por el Proveedor |
| `location_id` | UUID | FK → `locations.id` |
| `status` | TEXT | `pending_approval` \| `active` (RN-002, RN-025) |
| `onboarding_status` | TEXT | Avance del proceso de alta (campo v1.1) |
| `billing_email` | TEXT | Email de facturación (campo v1.1) |
| `payout_method` | TEXT | Método de cobro (campo v1.1) |
| `rating_avg` | NUMERIC | Promedio de valoraciones (usado en HU-016) |
| `created_at` | TIMESTAMP | Fecha de registro |
| `updated_at` | TIMESTAMP | Última modificación |

**Notas:**
- `status = 'active'` es condición necesaria para aparecer en búsquedas (RN-002).
- `rating_avg` es referenciado en HU-016 pero el sistema de valoraciones no está completamente documentado. Ver GAP-008.

---

### 3.3 `pets`
Perfil digital de mascota. Asociada a un Tutor (HU-003, HU-004).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` (tutor propietario) |
| `name` | TEXT | Nombre de la mascota (requerido) |
| `species` | TEXT | `perro` \| `gato` \| `otro` |
| `breed` | TEXT | Raza, con opción "mestizo" |
| `birth_date` | DATE | Fecha de nacimiento |
| `sex` | TEXT | Sexo del animal |
| `weight_kg` | NUMERIC | Peso aproximado (campo estático inicial) |
| `color_marks` | TEXT | Color y marcas distintivas (opcional) |
| `microchip_id` | TEXT | ID de chip/microchip (opcional) |
| `photo_url` | TEXT | URL en Supabase Storage bucket `pets`. Una única foto (RN-024) |
| `deleted_at` | TIMESTAMP | Baja lógica. NULL = activa (RN-003) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

**Notas:**
- Un registro con `deleted_at IS NOT NULL` se considera dado de baja.
- El "peso histórico" mencionado en HU-011 no tiene tabla de origen documentada. Ver GAP-009.

---

### 3.4 `locations`
Tabla centralizada de geolocalización. Reutilizable por múltiples entidades (SDD v1.1, §Notas).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `coordinates` | GEOGRAPHY(POINT) | Coordenadas geoespaciales PostGIS |
| `address` | TEXT | Dirección en texto libre |
| `neighborhood` | TEXT | Barrio/zona (relevante para Tutores en Córdoba) |
| `city` | TEXT | Ciudad |
| `created_at` | TIMESTAMP | Fecha de creación |

**Notas:**
- El tipo `GEOGRAPHY(POINT)` habilita directamente las consultas `ST_DWithin` de HU-016 y HU-012.
- Es referenciada por FK desde `users`/perfil de Tutor, `providers` y `lost_reports`.

---

### 3.5 `health_records`
Registro unificado de eventos de salud de una mascota. Cubre vacunas (HU-007), desparasitaciones (HU-008) y consultas clínicas (HU-010).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `pet_id` | UUID | FK → `pets.id` |
| `type` | TEXT | `vaccination` \| `deworming` \| `clinical_visit` |
| `applied_date` | DATE | Fecha de aplicación o consulta |
| `next_due_date` | DATE | Fecha de próximo vencimiento o cita |
| `frequency_days` | INTEGER | Solo para desparasitaciones. Valores: 15, 30, 60, 90, 180 (RN-011) |
| `vaccine_type` | TEXT | Solo para vacunas: Antirrábica, Séxtuple, Bordetella, Leishmaniasis, Otra |
| `deworming_type` | TEXT | Solo para desparasitaciones: interna, externa, ambas |
| `vet_name` | TEXT | Nombre del profesional (texto libre) |
| `batch_number` | TEXT | Número de lote de vacuna (opcional) |
| `visit_reason` | TEXT | Motivo de visita (consultas clínicas) |
| `diagnosis` | TEXT | Diagnóstico (consultas clínicas) |
| `treatment` | TEXT | Tratamiento prescrito (consultas clínicas) |
| `created_at` | TIMESTAMP | Fecha de registro |
| `updated_at` | TIMESTAMP | Última modificación |

**Notas:**
- La columna `next_due_date` es la que el cron job diario de HU-009 evalúa para disparar alertas.
- Los adjuntos de HU-010 (hasta 3 archivos, 5 MB c/u) se almacenan en Supabase Storage con FK a este registro. Ver GAP en tabla separada de adjuntos.

---

### 3.6 `passport_shares`
Enlace público compartido del pasaporte de salud (HU-011).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `pet_id` | UUID | FK → `pets.id` |
| `hash` | TEXT | Identificador único seguro (usado en `/passport/{hash}`) |
| `expires_at` | TIMESTAMP | Fecha de expiración (máx. 7 días desde creación, RN-008) |
| `created_at` | TIMESTAMP | Fecha de generación |

---

### 3.7 `schedules`
Grilla semanal de disponibilidad del Proveedor (HU-006).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `provider_id` | UUID | FK → `providers.id` |
| `day_of_week` | INTEGER | 0 = lunes … 6 = domingo |
| `is_closed` | BOOLEAN | Día marcado como cerrado |
| `blocks` | JSONB | Array de bloques de 30 min disponibles en ese día |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

**Notas:**
- La estructura de `blocks` (JSONB) permite representar la grilla de 30 minutos sin crear una fila por bloque.
- Estos datos alimentan el cálculo de disponibilidad de HU-017.

---

### 3.8 `service_areas`
Zonas de cobertura granular del Proveedor. Preparada para fases futuras (SDD v1.1, §Notas).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `provider_id` | UUID | FK → `providers.id` |
| `area` | GEOGRAPHY(POLYGON) | Polígono geoespacial de cobertura |
| `created_at` | TIMESTAMP | Fecha de creación |

**Notas:**
- En Fase 1 y Fase 2, la búsqueda usa `radius_km` de `providers`. Esta tabla está preparada pero no es operativa hasta que se defina en una fase posterior.
- Ver GAP-013 para la ambigüedad entre `radius_km` y `service_areas` en la consulta de HU-016.

---

### 3.9 `lost_reports`
Reportes de mascotas perdidas y encontradas (HU-012, HU-014, HU-015).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`. NULL si reporte anónimo |
| `pet_id` | UUID | FK → `pets.id`. NULL si mascota no registrada en la app |
| `type` | TEXT | `lost` (perdida) \| `found` (encontrada en vía pública) |
| `status` | TEXT | `lost` \| `found` \| `closed` (RN-013) |
| `photo_url` | TEXT | URL en Supabase Storage |
| `name` | TEXT | Nombre de la mascota |
| `species` | TEXT | Especie |
| `breed` | TEXT | Raza aparente |
| `color` | TEXT | Color y marcas |
| `sex` | TEXT | Sexo |
| `incident_date` | DATE | Fecha del suceso |
| `location_id` | UUID | FK → `locations.id` (última ubicación conocida) |
| `behavior` | TEXT | Descripción del comportamiento |
| `contact_phone` | TEXT | Teléfono de contacto |
| `reward_ars` | NUMERIC | Recompensa ofrecida (opcional, solo informativa) |
| `created_at` | TIMESTAMP | Fecha de publicación |
| `updated_at` | TIMESTAMP | Última modificación |

---

### 3.10 `bookings`
Reservas de turnos entre Tutor y Proveedor (HU-017). Tabla de Fase 2, pero su existencia es requerida por la cascada de HU-004.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tutor_id` | UUID | FK → `users.id` |
| `provider_id` | UUID | FK → `providers.id` |
| `pet_id` | UUID | FK → `pets.id` |
| `status` | TEXT | Estado actual de la reserva. `cancelled_by_tutor` documentado en HU-004. Ciclo completo pendiente (GAP-007) |
| `scheduled_at` | TIMESTAMP | Fecha y hora del turno |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

---

### 3.11 `booking_status_events`
Auditoría de cambios de estado de una reserva (SDD v1.1, §Notas).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `booking_id` | UUID | FK → `bookings.id` |
| `from_status` | TEXT | Estado anterior |
| `to_status` | TEXT | Estado nuevo |
| `changed_by` | UUID | FK → `users.id` del actor que generó el cambio |
| `reason` | TEXT | Motivo del cambio (opcional) |
| `created_at` | TIMESTAMP | Timestamp exacto del cambio |

---

## 4. Supabase Storage — Buckets

| Bucket | Contenido | HU de Origen | Límites |
|---|---|---|---|
| `pets` | Fotos de mascota (1 por mascota) | HU-003 | Sin límite de tamaño documentado |
| `providers` | Galería comercial del Proveedor | HU-006 | Máx. 6 fotos por Proveedor (RN-017) |
| `health_records` | Adjuntos de consultas clínicas | HU-010 | Máx. 3 archivos, 5 MB c/u (RN-023) |
| *(avatars)* | Fotos de perfil de Tutor | HU-002 | Sin nombre de bucket documentado en SDD |

---

## 5. Consultas Geoespaciales Clave

Derivadas directamente del SDD.

### Búsqueda de Proveedores (HU-016)
```sql
-- Proveedores activos dentro del radio del Tutor, ordenados por distancia y rating
ST_DWithin(provider.location, tutor.location, radius_meters)
ORDER BY
  ST_Distance(provider.location, tutor.location) ASC,
  providers.rating_avg DESC
```

### Notificación Masiva por Mascota Perdida (HU-012)
```sql
-- Usuarios en radio de 5 KM de la última ubicación de la mascota
ST_DWithin(user.location, lost_report.location, 5000)
```

### Motor de Coincidencias — Mascota Encontrada (HU-014)
```sql
-- Reportes de pérdida abiertos en radio de 3 KM
ST_DWithin(found_report.location, lost_report.location, 3000)
WHERE lost_reports.status = 'lost'
  AND lost_reports.species = found_report.species
  -- raza y color: lógica de matching no especificada en SDD (GAP-012)
```

---

## 6. Campos Pendientes de Definición

Los siguientes campos son referenciados en el SDD pero su estructura exacta no está especificada:

| Campo / Tabla | HU | GAP asociado |
|---|---|---|
| Sistema de valoraciones (`rating_avg`) | HU-016 | GAP-008 |
| Peso histórico de mascota | HU-011 | GAP-009 |
| Ciclo de vida completo de estados de `bookings` | HU-017 | GAP-007 |
| Nombre del bucket de avatars de Tutor | HU-002 | — |
| Tabla de adjuntos de `health_records` | HU-010 | — |
