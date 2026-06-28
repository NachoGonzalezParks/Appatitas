# Sprint 0 — Plan de Implementación
**Versión:** 1.0
**Fuente:** `docs/SDD_MASTER.md` v1.1 · `docs/technical-backlog.md` · `docs/domain-map.md` · `docs/architecture/database.md` · `docs/adrs/`
**Duración estimada:** 1 semana
**Fecha:** Mayo 2025

Sprint 0 no entrega funcionalidad de negocio. Entrega la plataforma técnica completa sobre la que todos los sprints posteriores construyen. Si Sprint 0 queda incompleto o con deuda técnica, cada sprint siguiente hereda ese problema.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 0

Cada tarea de Sprint 0 es un prerequisito directo de sprints posteriores. El impacto de no completarla es el bloqueo total de las HU que dependen de ella.

| Tarea Sprint 0 | Bloquea directamente | HU afectadas si falla |
|---|---|---|
| **S0-01** Proyecto Supabase | Todo el backlog | HU-001 a HU-017 |
| **S0-02** Esquema de BD | Toda operación de datos | HU-001 a HU-017 |
| **S0-03** Índice GIST PostGIS | Consultas geoespaciales | HU-012, HU-013, HU-014, HU-016 |
| **S0-04** Supabase Auth | Autenticación de actores | HU-001, HU-005 |
| **S0-05** Supabase Storage | Subida de archivos | HU-003, HU-006, HU-010, HU-012, HU-014 |
| **S0-06** Scaffold PWA | Todo módulo de UI | HU-001 a HU-017 |
| **S0-07** Resend | Email transaccional | HU-001 (verificación), HU-009 (alertas) |

### 1.2 Dependencias entre tareas del propio Sprint 0

El orden de ejecución dentro del sprint no es libre. Existen dependencias internas:

```
S0-01 (Proyecto Supabase)
  │
  ├──► S0-02 (Esquema BD)
  │         │
  │         └──► S0-03 (Índice GIST)   ← depende de que locations exista
  │
  ├──► S0-04 (Auth)                    ← depende de que el proyecto exista
  │
  ├──► S0-05 (Storage)                 ← depende de que el proyecto exista
  │
  └──► S0-07 (Resend)                  ← depende de que el proyecto exista para SMTP

S0-06 (Scaffold PWA)                   ← puede ejecutarse en paralelo desde día 1
```

S0-01 es el punto de partida absoluto. S0-02 debe completarse antes de S0-03. El resto puede ejecutarse en paralelo una vez que S0-01 esté listo.

### 1.3 Decisiones arquitectónicas que Sprint 0 materializa

Cada tarea de Sprint 0 implementa una decisión ya tomada en los ADRs:

| Tarea | ADR que materializa |
|---|---|
| S0-01 + S0-02 + S0-03 + S0-04 + S0-05 | ADR-001 (Supabase como backend único) |
| S0-02 + S0-03 | ADR-003 (PostGIS para geolocalización) |
| S0-04 | ADR-002 (Supabase Auth + RLS) |
| S0-06 | ADR-005 (PWA como frontend) |
| S0-07 | ADR-006 (Resend para email) |

### 1.4 Bounded Contexts que Sprint 0 habilita

Sprint 0 no pertenece a ningún Bounded Context de negocio. Es la capa de infraestructura transversal. Al completarse, habilita el inicio de:

| BC | Sprint que activa | Condición |
|---|---|---|
| BC-01 Identidad y Acceso | Sprint 1 | S0-01 + S0-04 completos |
| BC-02 Gestión de Perfiles | Sprint 1 | S0-02 + S0-05 completos |
| BC-03 Pasaporte de Salud | Sprint 2 | S0-02 + S0-07 completos |
| BC-04 Comunidad | Sprint 3 | S0-03 completo |
| BC-05 Marketplace | Sprint 5 | S0-03 + proceso externo Mercado Pago |

### 1.5 Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| PostGIS no disponible en el plan de Supabase seleccionado | Baja | Crítico — bloquea HU-012/013/014/016 | Verificar disponibilidad de PostGIS antes de crear el proyecto. Documentado en ADR-003. |
| App de Facebook requiere revisión de Meta antes de que OAuth esté activo | Alta | Alto — bloquea HU-001 completamente si solo se cuenta con Facebook | Iniciar proceso de revisión de Meta en día 1 del sprint. Configurar Google primero como alternativa. |
| GAP-014: política de RLS no documentada | Alta | Alto — el esquema se crea sin RLS, exponiendo datos en staging | Crear el esquema con RLS en modo permisivo (allow all) explícito y documentado. Nunca en producción sin políticas definidas. |
| Dominio de email no verificado en Resend bloquea envíos | Media | Alto — bloquea HU-001 (verificación de cuenta) | Iniciar verificación del dominio en Resend desde día 1. El proceso DNS puede tardar hasta 48 horas. |
| Dependencia de orden en la creación de tablas (FKs) | Media | Medio — un orden incorrecto genera error de FK | Ejecutar migraciones en el orden estricto definido en S0-02. |
| Nombre del bucket de avatars de Tutor | Resuelto | — | **Resuelto por RFC-001:** el bucket se llama `avatars` y queda en el corpus. HU-002 requiere el avatar del Tutor. |

---

## 2. Diseño Técnico

### 2.1 Proyecto Supabase — Configuración base (S0-01)

**Dos proyectos Supabase independientes:** uno para staging, uno para producción. Nunca compartir base de datos entre entornos.

**Variables de entorno requeridas por la PWA:**

| Variable | Descripción | Entorno |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase | Staging y Producción |
| `SUPABASE_ANON_KEY` | Clave pública para el cliente JS | Staging y Producción |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada para Edge Functions | Solo servidor (Edge Functions) |
| `RESEND_API_KEY` | API key de Resend | Solo servidor (Edge Functions) |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID para Web Push | Staging y Producción |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID para Web Push | Solo servidor (Edge Functions) |

**Extensiones de PostgreSQL a habilitar:**
- `postgis` — requerida por S0-03, HU-012, HU-013, HU-014, HU-016 (ADR-003)
- `pgcrypto` — para generación de hashes seguros en `passport_shares` (HU-011)
- `uuid-ossp` — para generación de UUIDs si no se usa `gen_random_uuid()`

### 2.2 Esquema de base de datos — Diseño por tabla (S0-02)

El orden de creación es estricto. Una tabla no puede crearse antes que las tablas a las que referencia con FK.

---

#### Orden 1 — `locations`
Sin dependencias. Primera tabla a crear.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `coordinates` | `geography(POINT, 4326)` | NOT NULL | HU-016, ADR-003 |
| `address` | `text` | NULLABLE | HU-002, HU-005 |
| `neighborhood` | `text` | NULLABLE | HU-002 |
| `city` | `text` | NULLABLE | HU-002 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

**Índice GIST** (S0-03, ejecutar inmediatamente después de crear esta tabla):
```
CREATE INDEX locations_coordinates_gist
ON locations USING GIST (coordinates);
```
Este índice es el requisito de rendimiento de `ST_DWithin` para HU-012, HU-013, HU-014 y HU-016. Sin él las consultas son full-scan.

---

#### Orden 2 — `users`
Depende de: Supabase Auth (UUID como PK provisto por Auth).

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK — mismo UUID que `auth.users` | HU-001 |
| `email` | `text` | NOT NULL, UNIQUE | RN-005 |
| `email_verified` | `boolean` | NOT NULL, default `false` | RN-004 |
| `full_name` | `text` | NULLABLE | RFC-001, HU-002 |
| `phone` | `text` | NULLABLE | RFC-001, HU-002 |
| `avatar_url` | `text` | NULLABLE | RFC-001, HU-002 |
| `location_id` | `uuid` | NULLABLE, FK → `locations.id` | RFC-001, HU-002, HU-016 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

**Nota RFC-002 (GAP-004):** `users` **no** tiene columna `role`. Los roles del usuario viven en `user_roles` (orden 13), permitiendo roles múltiples (`tutor` + `provider`). El trigger de Auth inserta en `users` y en `user_roles`.

**Nota RFC-001:** las cuatro columnas de perfil del Tutor son NULLABLE para no romper el INSERT del trigger de Auth (que solo dispone de `id` y `email`). `location_id` referencia `locations`, por lo que esta migración debe ejecutarse después de `0001_create_locations.sql`.

---

#### Orden 3 — `pets`
Depende de: `users`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | HU-003 |
| `name` | `text` | NOT NULL | HU-003 |
| `species` | `text` | NOT NULL, CHECK IN ('perro','gato','otro') | HU-003 |
| `breed` | `text` | NOT NULL | HU-003 |
| `birth_date` | `date` | NOT NULL | HU-003 |
| `sex` | `text` | NOT NULL | HU-003 |
| `weight_kg` | `numeric(5,2)` | NOT NULL | HU-003 |
| `color_marks` | `text` | NULLABLE | HU-003 |
| `microchip_id` | `text` | NULLABLE | HU-003 |
| `photo_url` | `text` | NULLABLE | HU-003, RN-024 |
| `deleted_at` | `timestamptz` | NULLABLE — NULL = activa | RN-003, HU-004 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

---

#### Orden 4 — `providers`
Depende de: `users`, `locations`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | HU-005 |
| `location_id` | `uuid` | NOT NULL, FK → `locations.id` | HU-005 |
| `business_name` | `text` | NOT NULL | HU-005 |
| `description` | `text` | NULLABLE, CHECK length ≤ 500 | HU-005 |
| `categories` | `text[]` | NOT NULL | HU-005 |
| `cuit_dni` | `text` | NULLABLE | HU-005 |
| `radius_km` | `numeric(6,2)` | NOT NULL | HU-005, GAP-013 |
| `status` | `text` | NOT NULL, CHECK IN ('pending_approval','active'), default `'pending_approval'` | RN-002, RN-025 |
| `onboarding_status` | `text` | NULLABLE | SDD v1.1 |
| `billing_email` | `text` | NULLABLE | SDD v1.1 |
| `payout_method` | `text` | NULLABLE | SDD v1.1 |
| `rating_avg` | `numeric(3,2)` | NULLABLE | HU-016, GAP-008 |
| `verified` | `boolean` | NOT NULL, default `false` | RN-021, HU-020 (sello "Verificado") |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

---

#### Orden 5 — `service_areas`
Depende de: `providers`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | SDD v1.1 |
| `provider_id` | `uuid` | NOT NULL, FK → `providers.id` | SDD v1.1 |
| `area` | `geography(POLYGON, 4326)` | NOT NULL | SDD v1.1, ADR-003 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

**Nota GAP-013:** esta tabla está preparada para fases futuras. En Fase 1 y Fase 2, la búsqueda usa `providers.radius_km`. El uso operativo de esta tabla no está definido aún.

---

#### Orden 6 — `schedules`
Depende de: `providers`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `provider_id` | `uuid` | NOT NULL, FK → `providers.id` | HU-006 |
| `day_of_week` | `integer` | NOT NULL, CHECK BETWEEN 0 AND 6 (0 = domingo … 6 = sábado, convención `EXTRACT(DOW)`) | HU-006, RN-018 |
| `is_closed` | `boolean` | NOT NULL, default `false` | HU-006 |
| `blocks` | `jsonb` | NULLABLE | HU-006, RN-018 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

**Nota sobre `blocks`:** almacena el array de bloques de 30 minutos disponibles para ese día. La estructura interna del JSONB (ej: `[{"start":"09:00","end":"09:30"}, ...]`) no está especificada en el SDD. Requiere definición antes de Sprint 4.

---

#### Orden 7 — `health_records`
Depende de: `pets`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `pet_id` | `uuid` | NOT NULL, FK → `pets.id` | HU-007, HU-008, HU-010 |
| `type` | `text` | NOT NULL, CHECK IN ('vaccination','deworming','clinical_visit') | HU-007/008/010 |
| `applied_date` | `date` | NOT NULL | HU-007, HU-008, HU-010 |
| `next_due_date` | `date` | NULLABLE | HU-007, HU-008, HU-009 |
| `frequency_days` | `integer` | NULLABLE, CHECK IN (15,30,60,90,180) | RN-011, HU-008 |
| `vaccine_type` | `text` | NULLABLE | HU-007 |
| `deworming_type` | `text` | NULLABLE, CHECK IN ('interna','externa','ambas') | HU-008 |
| `vet_name` | `text` | NULLABLE | HU-007, HU-010 |
| `batch_number` | `text` | NULLABLE | HU-007 |
| `visit_reason` | `text` | NULLABLE | HU-010 |
| `diagnosis` | `text` | NULLABLE | HU-010 |
| `treatment` | `text` | NULLABLE | HU-010 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

---

#### Orden 8 — `passport_shares`
Depende de: `pets`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `pet_id` | `uuid` | NOT NULL, FK → `pets.id` | HU-011 |
| `hash` | `text` | NOT NULL, UNIQUE | HU-011, RN-008 |
| `expires_at` | `timestamptz` | NOT NULL | RN-008 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

---

#### Orden 9 — `lost_reports`
Depende de: `users` (nullable), `pets` (nullable), `locations`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `user_id` | `uuid` | NULLABLE, FK → `users.id` | HU-012 (anónimo posible) |
| `pet_id` | `uuid` | NULLABLE, FK → `pets.id` | HU-012 (vinculación opcional) |
| `location_id` | `uuid` | NOT NULL, FK → `locations.id` | HU-012 |
| `type` | `text` | NOT NULL, CHECK IN ('lost','found') | HU-012, HU-014 |
| `status` | `text` | NOT NULL, CHECK IN ('lost','found','closed'), default `'lost'` | RN-013 |
| `photo_url` | `text` | NOT NULL | HU-012, HU-014 |
| `name` | `text` | NULLABLE | HU-012 |
| `species` | `text` | NOT NULL | HU-012, HU-014 |
| `breed` | `text` | NULLABLE | HU-012 |
| `color` | `text` | NULLABLE | HU-012 |
| `sex` | `text` | NULLABLE | HU-012 |
| `incident_date` | `date` | NULLABLE | HU-012 |
| `behavior` | `text` | NULLABLE | HU-012 |
| `contact_phone` | `text` | NOT NULL | HU-012, HU-014 |
| `reward_ars` | `numeric(12,2)` | NULLABLE | HU-012 — solo informativo |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

---

#### Orden 10 — `bookings`
Depende de: `users`, `providers`, `pets`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | database.md |
| `tutor_id` | `uuid` | NOT NULL, FK → `users.id` | HU-017 |
| `provider_id` | `uuid` | NOT NULL, FK → `providers.id` | HU-017 |
| `pet_id` | `uuid` | NOT NULL, FK → `pets.id` | HU-017 |
| `status` | `text` | NOT NULL — ciclo de vida completo pendiente GAP-007 | HU-004, HU-017 |
| `scheduled_at` | `timestamptz` | NOT NULL | HU-017 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | database.md |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | database.md |

**Nota GAP-007:** la tabla se crea en Sprint 0 porque HU-004 (Sprint 1) necesita hacer UPDATE sobre ella en la cascada de baja de mascota. Los valores válidos del campo `status` no están completos en el SDD. El único valor documentado es `'cancelled_by_tutor'` (HU-004). El ciclo completo requiere RFC antes de Sprint 5.

---

#### Orden 11 — `booking_status_events`
Depende de: `bookings`, `users`.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | SDD v1.1 |
| `booking_id` | `uuid` | NOT NULL, FK → `bookings.id` | SDD v1.1 |
| `from_status` | `text` | NULLABLE — NULL en estado inicial | SDD v1.1 |
| `to_status` | `text` | NOT NULL | SDD v1.1 |
| `changed_by` | `uuid` | NOT NULL, FK → `users.id` | SDD v1.1 |
| `reason` | `text` | NULLABLE | SDD v1.1 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | SDD v1.1 |

**Esta tabla es inmutable.** No se actualiza; solo se insertan filas. Cada transición de estado de una reserva genera un nuevo registro.

---

#### Orden 12 — `push_subscriptions`
Depende de: `users`. Tabla agregada por RFC-001.

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | RFC-001 |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | RFC-001 |
| `endpoint` | `text` | NOT NULL, UNIQUE | RFC-001 |
| `p256dh` | `text` | NOT NULL | RFC-001 |
| `auth` | `text` | NOT NULL | RFC-001 |
| `user_agent` | `text` | NULLABLE | RFC-001 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | RFC-001 |

**Nota RFC-001:** almacena la suscripción Web Push completa por dispositivo (relación 1:N con `users`). Es la fuente de los envíos push de HU-009, HU-012 y HU-014, reemplazando la referencia a `users.push_token` de los diagramas. Requiere RLS: cada usuario solo gestiona sus propias suscripciones.

---

#### Orden 13 — `user_roles`
Depende de: `users`. Tabla agregada por RFC-002 (resuelve GAP-004).

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `user_id` | `uuid` | NOT NULL, FK → `users.id`, parte de PK | RFC-002 |
| `role` | `text` | NOT NULL, CHECK IN ('tutor','provider','admin'), parte de PK | RFC-002 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | RFC-002 |

**Nota RFC-002:** PRIMARY KEY (`user_id`, `role`). Reemplaza la columna escalar `users.role`. El trigger de Auth inserta aquí el rol elegido en el onboarding. El rol `admin` se asigna solo manualmente (RFC-003). La RLS usa la función `has_role(uid, r)` sobre esta tabla.

---

#### Orden 14 — `admin_audit_log`
Depende de: `users`. Tabla agregada por RFC-003 (resuelve GAP-005).

| Columna | Tipo | Restricciones | Origen SDD |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | RFC-003 |
| `admin_id` | `uuid` | NOT NULL, FK → `users.id` | RFC-003 |
| `action` | `text` | NOT NULL | RFC-003 |
| `target_table` | `text` | NOT NULL | RFC-003 |
| `target_id` | `uuid` | NOT NULL | RFC-003 |
| `metadata` | `jsonb` | NULLABLE | RFC-003 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | RFC-003 |

**Nota RFC-003:** tabla inmutable (solo INSERT). Registra cada acción sensible del Admin (HU-020 aprobación de Proveedores, HU-021 moderación, HU-018 asignación de rol). RLS: solo INSERT; lectura restringida a `admin`.

---

### 2.3 Supabase Auth — Configuración (S0-04)

**Proveedores a habilitar:**

| Proveedor | Configuración | HU | Observación |
|---|---|---|---|
| Email/Contraseña | Activar `Confirm email: true` | HU-001 | Verificación obligatoria (RN-004) |
| Google OAuth 2.0 | Client ID + Client Secret de Google Cloud Console | HU-001 | Disponible de inmediato |
| Facebook OAuth 2.0 | App ID + App Secret de Meta Developers | HU-001 | Requiere revisión de Meta — iniciar día 1 |

**Trigger en Auth:** al crear un usuario en `auth.users`, insertar automáticamente en `public.users` y en `user_roles` con el rol seleccionado en el formulario de onboarding (RFC-002). El rol `admin` nunca se asigna por esta vía.

**SMTP personalizado:** configurar Resend como proveedor SMTP en Supabase Auth para los emails de verificación (S0-07 debe estar listo primero).

### 2.4 Supabase Storage — Buckets (S0-05)

| Bucket | Acceso | Política de lectura | Política de escritura | HU |
|---|---|---|---|---|
| `pets` | Mixto | Público para URLs en pasaporte compartido (HU-011). Privado por defecto. | Solo el Tutor propietario de la mascota | HU-003 |
| `providers` | Público | Público — visible en búsquedas (HU-016) | Solo el Proveedor propietario | HU-006 |
| `health-records` | Privado | Solo Tutor propietario de la mascota | Solo Tutor propietario de la mascota | HU-010 |
| `avatars` | Público | Público | Solo el propio usuario | HU-002 |

**Nota:** el bucket `avatars` queda confirmado por RFC-001 (HU-002 requiere avatar del Tutor). Ya no es una decisión pendiente.

### 2.5 PWA — Scaffold (S0-06)

**Web App Manifest — campos requeridos por el SDD:**

| Campo | Valor | Origen |
|---|---|---|
| `name` | `APPATITAS` | SDD §1 |
| `display` | `standalone` | ADR-005 |
| `start_url` | `/` | ADR-005 |
| `theme_color` | A definir por diseño | — |
| `background_color` | A definir por diseño | — |
| `icons` | Al menos 192×192 y 512×512 | ADR-005 |

**Service Worker — capacidades requeridas en Sprint 0:**
- Cache de shell estática (layout, assets críticos).
- Receptor de push messages (infraestructura para HU-009 y HU-012).
- El Service Worker no procesa lógica de negocio en Sprint 0; solo la infraestructura base.

**Rutas públicas a configurar desde Sprint 0** (sin autenticación):
- `/passport/:hash` → HU-011
- `/mapa` → HU-013
- `/encontrada` → HU-014

### 2.6 Resend — Integración (S0-07)

**Configuración requerida:**
- Cuenta Resend creada y dominio verificado (registro DNS: SPF, DKIM, DMARC).
- API key almacenada como secret en Supabase Edge Functions.
- Función utilitaria de envío: recibe `(to, subject, html)` y devuelve `{success, error}`.

**Usos futuros que esta función utilitaria cubrirá:**
- HU-001: email de verificación de cuenta.
- HU-009: alertas de salud (vencimiento de vacunas y desparasitaciones).

---

## 3. Estructura de Carpetas

La estructura se organiza por Bounded Context (dominio) en frontend y por tipo en el backend (Supabase).

```
appatitas/
│
├── docs/                                # Documentación normativa (ya existente)
│   ├── SDD_MASTER.md
│   ├── SDD_LOCK.md
│   ├── GAP_ANALYSIS.md
│   ├── business-rules.md
│   ├── traceability.md
│   ├── domain-map.md
│   ├── technical-backlog.md
│   ├── system-architecture.md
│   ├── sprint-0-plan.md                 ← este documento
│   ├── adrs/
│   │   ├── ADR-001-supabase.md
│   │   ├── ADR-002-Authentication-and-RLS.md
│   │   ├── ADR-003-PostGIS-Geolocation.md
│   │   ├── ADR-004-MercadoPago-Escrow.md
│   │   ├── ADR-005-PWA-Architecture.md
│   │   └── ADR-006-Notifications.md
│   ├── architecture/
│   │   ├── database.md
│   │   └── security.md
│   └── requirements/
│       ├── phase-1-mvp.md
│       └── phase-2-marketplace.md
│
├── supabase/                            # Todo lo que corre en Supabase
│   │
│   ├── migrations/                      # Migraciones SQL en orden estricto
│   │   ├── 0001_create_locations.sql    # S0-02 — orden 1
│   │   ├── 0002_create_users.sql        # S0-02 — orden 2 (incluye perfil Tutor · RFC-001)
│   │   ├── 0003_create_pets.sql         # S0-02 — orden 3
│   │   ├── 0004_create_providers.sql    # S0-02 — orden 4
│   │   ├── 0005_create_service_areas.sql# S0-02 — orden 5
│   │   ├── 0006_create_schedules.sql    # S0-02 — orden 6
│   │   ├── 0007_create_health_records.sql# S0-02 — orden 7
│   │   ├── 0008_create_passport_shares.sql# S0-02 — orden 8
│   │   ├── 0009_create_lost_reports.sql # S0-02 — orden 9
│   │   ├── 0010_create_bookings.sql     # S0-02 — orden 10
│   │   ├── 0011_create_booking_status_events.sql # S0-02 — orden 11
│   │   ├── 0012_create_gist_index.sql   # S0-03 — índice espacial
│   │   ├── 0013_create_push_subscriptions.sql # S0-02 — orden 12 · RFC-001
│   │   ├── 0014_create_user_roles.sql   # S0-02 — orden 13 · RFC-002
│   │   └── 0015_create_admin_audit_log.sql # S0-02 — orden 14 · RFC-003
│   │
│   ├── functions/                       # Edge Functions (Deno)
│   │   ├── _shared/                     # Código compartido entre funciones
│   │   │   ├── supabase-client.ts       # Cliente Supabase admin
│   │   │   └── resend-client.ts         # Función utilitaria Resend (S0-07)
│   │   │
│   │   ├── health-alerts-cron/          # Sprint 2 — HU-009
│   │   │   └── index.ts
│   │   ├── lost-pet-notify/             # Sprint 3 — HU-012
│   │   │   └── index.ts
│   │   ├── found-pet-match/             # Sprint 3 — HU-014
│   │   │   └── index.ts
│   │   ├── report-closed/               # Sprint 3 — HU-015
│   │   │   └── index.ts
│   │   └── booking-payment/             # Sprint 5 — HU-017*
│   │       └── index.ts
│   │
│   ├── seed/                            # Datos de prueba para staging
│   │   └── seed.sql
│   │
│   └── config.toml                      # Configuración de Supabase CLI
│
├── src/                                 # PWA — código fuente
│   │
│   ├── main.ts                          # Punto de entrada
│   ├── sw.ts                            # Service Worker
│   ├── manifest.json                    # Web App Manifest
│   │
│   ├── lib/                             # Utilidades transversales
│   │   ├── supabase.ts                  # Instancia del cliente Supabase
│   │   ├── auth.ts                      # Helpers de autenticación
│   │   └── geolocation.ts              # Wrapper de Geolocation API
│   │
│   ├── router/                          # Configuración de rutas
│   │   ├── index.ts                     # Definición de rutas
│   │   ├── guards.ts                    # Guards de autenticación
│   │   └── public-routes.ts             # /passport/:hash · /mapa · /encontrada
│   │
│   ├── stores/                          # Estado global
│   │   ├── auth.store.ts                # Sesión y usuario activo
│   │   └── pet.store.ts                 # Mascota seleccionada activa
│   │
│   ├── bc01-identity/                   # BC-01 Identidad y Acceso
│   │   ├── pages/
│   │   │   ├── RegisterPage.vue         # HU-001: selección de rol
│   │   │   ├── LoginPage.vue            # HU-001: login
│   │   │   └── EmailVerifyPage.vue      # HU-001: verificación pendiente
│   │   ├── components/
│   │   │   ├── RoleSelectorForm.vue     # "Tutor" / "Proveedor"
│   │   │   ├── EmailPasswordForm.vue
│   │   │   └── OAuthButtons.vue         # Google + Facebook
│   │   └── services/
│   │       └── auth.service.ts          # Llama a Supabase Auth
│   │
│   ├── bc02-profiles/                   # BC-02 Gestión de Perfiles
│   │   ├── pages/
│   │   │   ├── TutorProfilePage.vue     # HU-002
│   │   │   ├── PetListPage.vue          # HU-003/004
│   │   │   ├── PetFormPage.vue          # HU-003/004
│   │   │   ├── ProviderProfilePage.vue  # HU-005
│   │   │   ├── ProviderGalleryPage.vue  # HU-006
│   │   │   └── ProviderSchedulePage.vue # HU-006
│   │   ├── components/
│   │   │   ├── ProfileBanner.vue        # Banner de progreso (HU-002)
│   │   │   ├── PetCard.vue
│   │   │   ├── PhotoUploader.vue        # Reutilizable: pets + providers + avatars
│   │   │   ├── GalleryUploader.vue      # Máx 6 fotos (RN-017)
│   │   │   └── ScheduleGrid.vue         # Grilla 30 min (RN-018)
│   │   └── services/
│   │       ├── pet.service.ts
│   │       └── provider.service.ts
│   │
│   ├── bc03-health/                     # BC-03 Pasaporte Digital de Salud
│   │   ├── pages/
│   │   │   ├── HealthDashboardPage.vue  # HU-007/008/010 consolidado
│   │   │   ├── VaccinationFormPage.vue  # HU-007
│   │   │   ├── DewormingFormPage.vue    # HU-008
│   │   │   ├── AlertsSettingsPage.vue   # HU-009
│   │   │   ├── ClinicalVisitFormPage.vue# HU-010
│   │   │   └── PassportPage.vue         # HU-011 (autenticado + público)
│   │   ├── components/
│   │   │   ├── HealthRecordList.vue
│   │   │   ├── VaccineAlert.vue         # ⚠️ Vence en X días (RN-022)
│   │   │   ├── HealthTimeline.vue       # HU-010
│   │   │   └── PassportShareCard.vue    # Enlace + expiración (RN-008)
│   │   └── services/
│   │       ├── health.service.ts
│   │       └── passport.service.ts
│   │
│   ├── bc04-community/                  # BC-04 Comunidad y Mascotas Perdidas
│   │   ├── pages/
│   │   │   ├── LostPetFormPage.vue      # HU-012
│   │   │   ├── CommunityMapPage.vue     # HU-013 (pública)
│   │   │   ├── FoundPetFormPage.vue     # HU-014 (pública)
│   │   │   └── ReportDetailPage.vue     # HU-015
│   │   ├── components/
│   │   │   ├── LostPetMap.vue           # Mapa con pines (HU-013)
│   │   │   ├── LostPetCard.vue          # Card flotante en mapa
│   │   │   ├── RadiusSelector.vue       # 5 / 10 / 20 KM (HU-013)
│   │   │   └── ReportStatusBadge.vue    # lost / found / closed
│   │   └── services/
│   │       └── lost-report.service.ts
│   │
│   ├── bc05-marketplace/                # BC-05 Marketplace Transaccional
│   │   ├── pages/
│   │   │   ├── SearchPage.vue           # HU-016
│   │   │   ├── ProviderDetailPage.vue   # HU-016
│   │   │   ├── BookingFormPage.vue      # HU-017
│   │   │   └── BookingConfirmPage.vue   # HU-017*
│   │   ├── components/
│   │   │   ├── ProviderCard.vue         # Tarjeta con rating, distancia (HU-016)
│   │   │   ├── VerifiedBadge.vue        # Sello Verificado (RN-021)
│   │   │   ├── AvailabilityCalendar.vue # Slots de 30 min (HU-017)
│   │   │   └── SearchFilters.vue        # Precio, rating, disponibilidad
│   │   └── services/
│   │       ├── search.service.ts
│   │       └── booking.service.ts
│   │
│   └── shared/                          # Componentes y utilidades sin BC
│       ├── components/
│       │   ├── MapView.vue              # Mapa reutilizable (HU-013, HU-016)
│       │   ├── FileUploader.vue         # Upload genérico con validación
│       │   ├── ConfirmModal.vue
│       │   └── LoadingSpinner.vue
│       └── types/
│           └── supabase.types.ts        # Tipos generados del esquema
│
├── .env.staging                         # Variables de staging (no commitear)
├── .env.production                      # Variables de producción (no commitear)
├── .env.example                         # Plantilla de variables (sí commitear)
└── .gitignore
```

---

## 4. Plan de Implementación

### 4.1 Secuencia de ejecución dentro del Sprint 0

El sprint tiene duración de 1 semana. El equipo es de **3 desarrolladores**, por lo que el trabajo se reparte en **tres carriles** (no dos), asignados a roles explícitos para evitar el desbalance y los puntos únicos de falla detectados en la revisión pre-Sprint 0:

- **Dev 1 — Datos:** S0-01 (proyecto Supabase) + S0-02 (migraciones, incluida `push_subscriptions` de RFC-001) + S0-03 (índice GIST).
- **Dev 2 — Frontend:** S0-06 (scaffold PWA, Service Worker, Manifest, cliente Supabase, router).
- **Dev 3 — Plataforma:** S0-04 (Auth + trigger `users`) + S0-05 (Storage) + S0-07 (Resend) + scaffolds de Edge Functions.

> **Coordinación clave:** el trigger Auth → `public.users` (Dev 3, S0-04) llena la tabla `users` que crea Dev 1 (S0-02). Ambos deben acordar el contrato de columnas (incluidas las de RFC-001) en el Día 1. El SMTP de Auth (S0-04) depende del DNS de Resend (S0-07), ambos en el carril de Dev 3: por eso Dev 3 inicia la verificación DNS el Día 1 (puede tardar 48h) y avanza el resto sin bloquearse.

```
DÍA 1
├── Dev 1 (Datos):     S0-01 Crear proyecto Supabase (staging + producción)
│                      Habilitar PostGIS, pgcrypto, uuid-ossp
├── Dev 2 (Frontend):  S0-06 Scaffold PWA · estructura de carpetas
│                      Router base con rutas públicas y privadas · .env.example
└── Dev 3 (Plataforma):Iniciar proceso Meta (Facebook OAuth) ← no bloqueable
                       Iniciar verificación DNS en Resend     ← puede tardar 48h
                       Acordar contrato de columnas de `users` con Dev 1

DÍA 2
├── Dev 1:     S0-02 Migraciones 0001 → 0006
│              locations · users (con perfil Tutor · RFC-001) · pets · providers · service_areas · schedules
│              S0-03 Índice GIST (inmediatamente después de locations)
├── Dev 2:     S0-06 Service Worker base · Web App Manifest
│              Instancia del cliente Supabase en src/lib/supabase.ts
└── Dev 3:     S0-04 Auth: habilitar email/contraseña + Google OAuth
               Trigger Auth → public.users (contrato acordado con Dev 1)

DÍA 3
├── Dev 1:     S0-02 Migraciones 0007 → 0015
│              health_records · passport_shares · lost_reports · bookings
│              booking_status_events · push_subscriptions (RFC-001)
│              user_roles (RFC-002) · admin_audit_log (RFC-003) · índice GIST (confirmación)
├── Dev 2:     S0-06 Rutas públicas (/passport/:hash · /mapa · /encontrada)
│              Guards de autenticación · stores base
└── Dev 3:     S0-07 Resend: función utilitaria en _shared/resend-client.ts
               (pendiente verificación DNS si aún no completó)

DÍA 4
├── Dev 1:     Verificar integridad referencial de las 14 tablas
│              Generar tipos de Supabase (supabase.types.ts) para Dev 2
├── Dev 2:     Integrar supabase.types.ts · login básico contra Auth de Dev 3
└── Dev 3:     S0-05 Crear buckets (pets · providers · health-records · avatars)
               Definir políticas por bucket · conectar SMTP Resend cuando DNS esté listo
               Scaffolds vacíos de Edge Functions (_shared · carpetas)

DÍA 5 — Integración y verificación (los 3 devs, con Dev 1 como responsable de integración)
├── Verificar conexión PWA ↔ Supabase Auth (login básico funciona)
├── Verificar que las 14 tablas existen con columnas correctas (incl. perfil Tutor, push_subscriptions, user_roles, admin_audit_log)
├── Verificar índice GIST creado sobre locations.coordinates
├── Verificar los 4 buckets de Storage con sus políticas
├── Verificar envío de email de prueba vía Resend
├── Verificar que Facebook OAuth está en revisión (no bloquea el sprint)
└── Actualizar .env.example con todas las variables identificadas
```

### 4.2 Criterios de aceptación del Sprint 0

El Sprint 0 se considera completo únicamente cuando todos los siguientes puntos son verificables:

**Supabase:**
- [ ] Proyecto staging y proyecto producción creados y accesibles.
- [ ] Extensión PostGIS habilitada (verificar con `SELECT postgis_version()`).
- [ ] Las 14 tablas existen en el esquema `public` con todas sus columnas (incluye `push_subscriptions`, `user_roles`, `admin_audit_log` y el perfil del Tutor en `users` — RFC-001/002/003).
- [ ] El índice GIST existe sobre `locations.coordinates`.
- [ ] Los 3 proveedores de Auth configurados (email, Google, Facebook*).
- [ ] Los 4 buckets de Storage creados con políticas de acceso definidas.
- [ ] SMTP de Resend configurado en Supabase Auth.

**PWA:**
- [ ] Proyecto arranca sin errores.
- [ ] Service Worker se registra correctamente en el navegador.
- [ ] Web App Manifest válido (verificar con Lighthouse).
- [ ] Rutas públicas (`/passport/:hash`, `/mapa`, `/encontrada`) accesibles sin sesión.
- [ ] Rutas privadas redirigen a login si no hay sesión.
- [ ] Cliente Supabase conecta correctamente al proyecto staging.

**Resend:**
- [ ] Dominio verificado (SPF, DKIM, DMARC en verde).
- [ ] Función utilitaria de envío de email probada manualmente.

**Variables de entorno:**
- [ ] `.env.example` con todas las variables necesarias documentadas.
- [ ] `.env.staging` y `.env.production` en `.gitignore`.

**(*) Facebook OAuth:** si la revisión de Meta no está aprobada al finalizar el sprint, no bloquea el cierre del Sprint 0. Se documenta como pendiente externo y Sprint 1 arranca con Google + email/contraseña.

### 4.3 Checklist de gaps a declarar antes de cerrar Sprint 0

Antes de dar el sprint por cerrado, el equipo debe confirmar la posición sobre los siguientes gaps que afectan decisiones de este sprint:

| Gap | Pregunta a responder antes de cerrar Sprint 0 |
|---|---|
| GAP-014 | ¿Las políticas de RLS se crean ahora en modo permisivo o se bloquea todo hasta tener las políticas definitivas? (Incluir la RLS de `push_subscriptions` — RFC-001.) |
| GAP-007 | ¿Qué valor inicial de `status` se usa en `bookings` para no dejar el CHECK constraint vacío? |
| GAP-013 | ¿Se confirma que `radius_km` en `providers` es el campo operativo en Fase 1 y 2, y `service_areas` queda inactiva? |
