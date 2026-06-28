# Mapa de Dominio — APPATITAS
**Versión:** 1.2
**Fuente:** `docs/SDD_MASTER.md` v1.2 · `docs/rfcs/RFC-001..003`
**Fecha:** Mayo 2025 · Revisión: 2026-06-25 (RFC-001/002/003)

Todo elemento de este documento tiene origen trazable en el SDD_MASTER.
Los elementos marcados con `*` están referenciados en el SDD pero sin especificación completa (ver `docs/GAP_ANALYSIS.md`).

---

## 1. Visión del Dominio

APPATITAS es un **Marketplace Transaccional de Servicios para Mascotas** que opera en dos dimensiones simultáneas:

- **Dimensión de retención (Fase 1):** herramientas gratuitas que generan hábito de uso diario en el Tutor (pasaporte de salud, mascotas perdidas).
- **Dimensión de monetización (Fase 2):** transacciones entre Tutores y Proveedores con comisión retenida por la plataforma.

El dominio tiene **cuatro actores** con roles bien diferenciados: Tutor, Proveedor, Admin y Ciudadano (actor anónimo).

---

## 2. Bounded Contexts

El dominio se divide en cinco Bounded Contexts con fronteras funcionales claras.

---

### BC-01 — Identidad y Acceso

**Propósito:** Gestionar el ciclo de vida de la identidad de todos los actores del sistema. Es el contexto fundacional del que dependen todos los demás.

**Responsabilidades:**
- Registro y autenticación de Tutores y Proveedores.
- Verificación de email obligatoria antes de habilitar acceso.
- Asignación y control de los roles del usuario vía `user_roles` (`tutor`, `provider`, `admin`). Un usuario puede acumular roles (RFC-002).
- Acceso y permisos del Administrador, y auditoría de sus acciones en `admin_audit_log` (RFC-003, HU-018).

**Entidades:**
- `User` (identidad base)
- `UserRole` (roles del usuario · RFC-002)
- `AdminAuditLog` (auditoría de acciones del Admin · RFC-003)

**Límites hacia afuera:**
- Provee `user_id` y los roles (`user_roles`) a todos los demás contextos.
- No conoce mascotas, servicios ni transacciones.
- El Admin (RFC-003) opera de forma transversal sobre BC-02 (aprobar Proveedores) y BC-04 (moderar reportes), pero su identidad y permisos pertenecen a BC-01.

**HU:** HU-001, HU-005 (flujo de registro) · HU-018, HU-019, HU-020, HU-021 (Administración · RFC-003)

---

### BC-02 — Gestión de Perfiles

**Propósito:** Mantener los perfiles operativos de Tutores, Proveedores y Mascotas. Es el contexto de datos maestros del sistema.

**Responsabilidades:**
- Perfil extendido del Tutor (nombre, ubicación, contacto).
- Perfil comercial del Proveedor (negocio, categorías, cobertura, galería, horarios).
- Perfil digital de la mascota (especie, raza, datos de salud básicos).
- Eliminación lógica de mascotas con cascada sobre reservas.

**Entidades:**
- `Tutor` (extensión del User con ubicación y contacto)
- `Provider` (entidad comercial con cobertura geográfica y horarios)
- `Pet` (perfil digital de la mascota)
- `Location` (tabla compartida de geolocalización)
- `Schedule` (grilla semanal de disponibilidad del Proveedor)
- `ServiceArea` (polígono de cobertura granular, preparada para fases futuras)

**Límites hacia afuera:**
- BC-03 (Salud) consume `Pet` para registrar eventos de salud.
- BC-04 (Comunidad) consume `Pet` y `Location` para reportes de pérdida.
- BC-05 (Marketplace) consume `Provider`, `Schedule` y `Location` para búsqueda y reservas.

**HU:** HU-002, HU-003, HU-004, HU-005, HU-006

---

### BC-03 — Pasaporte Digital de Salud

**Propósito:** Registrar, centralizar y comunicar el historial de salud de cada mascota. Es el principal motor de retención de Tutores en Fase 1.

**Responsabilidades:**
- Registro de vacunaciones con fechas de vencimiento.
- Registro de desparasitaciones con cálculo automático de próxima dosis.
- Historial de consultas clínicas con adjuntos.
- Alertas automáticas por vencimiento (30/7/0 días) con snooze.
- Generación y exposición de pasaporte compartido con enlace público y expiración.

**Entidades:**
- `HealthRecord` (registro unificado: vacuna, desparasitación o consulta clínica)
- `PassportShare` (enlace público temporal con hash seguro)

**Límites hacia afuera:**
- Consume `Pet` de BC-02 (toda entrada de salud pertenece a una mascota).
- No conoce Proveedores ni transacciones.
- El enlace de `PassportShare` es accesible públicamente sin sesión (cruce con BC-01 solo en creación).

**HU:** HU-007, HU-008, HU-009, HU-010, HU-011

---

### BC-04 — Comunidad y Mascotas Perdidas

**Propósito:** Facilitar la búsqueda y recuperación de mascotas perdidas mediante reportes geolocalizados, notificaciones masivas y un motor de coincidencias. Es el principal motor de crecimiento viral de Fase 1.

**Responsabilidades:**
- Publicación de reportes de pérdida geolocalizados.
- Notificación push masiva a usuarios en radio de 5 KM.
- Mapa comunitario interactivo de acceso público.
- Registro de mascotas encontradas por ciudadanos anónimos.
- Motor de coincidencias automático entre reportes de encontradas y perdidas en radio de 3 KM.
- Cierre de reportes con publicación automática de agradecimiento en feed*.

**Entidades:**
- `LostReport` (reporte de pérdida o hallazgo con ciclo de vida: `lost` → `found` → `closed`)
- `Location` (compartida con BC-02)

**Límites hacia afuera:**
- Consume `Pet` de BC-02 (vinculación opcional con mascota registrada).
- Consume `User`/ubicación de BC-01 para determinar destinatarios de notificaciones.
- No conoce Proveedores ni transacciones.
- Accesible parcialmente sin autenticación (mapa y formulario de encontrada son públicos).

**HU:** HU-012, HU-013, HU-014, HU-015

---

### BC-05 — Marketplace Transaccional

**Propósito:** Orquestar el encuentro entre Tutores y Proveedores, gestionar la agenda de turnos y procesar los pagos con retención de comisión. Es el contexto de monetización de Fase 2.

**Responsabilidades:**
- Búsqueda geoespacial de Proveedores activos por proximidad y especie de mascota.
- Filtrado por categoría, precio, disponibilidad y rating.
- Gestión de la agenda de turnos del Proveedor.
- Reserva de turno con procesamiento de pago y retención de comisión (escrow).
- Liberación de fondos al Proveedor tras verificación del servicio realizado*.
- Auditoría de transiciones de estado de cada reserva.

**Entidades:**
- `Booking` (reserva con estado auditado)
- `BookingStatusEvent` (registro inmutable de cada transición de estado)

**Límites hacia afuera:**
- Consume `Provider`, `Schedule`, `Location` y `ServiceArea` de BC-02.
- Consume `Pet` de BC-02 (la reserva vincula una mascota específica).
- Consume `User` de BC-01 para identificar Tutor y Proveedor.
- Delega procesamiento de pago a Mercado Pago Marketplace (servicio externo).

**HU:** HU-016, HU-017

---

## 3. Diagrama de Bounded Contexts y Dependencias

```
┌─────────────────────────────────────────────────────────────────┐
│                     BC-01 · IDENTIDAD Y ACCESO                  │
│                                                                  │
│   User (role: tutor | provider | admin)                         │
│   Supabase Auth · OAuth 2.0 Google/Facebook · Email/Pass        │
│   Verificación email · Aprobación Admin de Proveedores          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ user_id + role (provee a todos)
           ┌───────────────┼───────────────────┐
           ▼               ▼                   ▼
┌──────────────────┐  ┌────────────────────────────────────────┐
│  BC-03 · SALUD   │  │         BC-02 · PERFILES               │
│                  │  │                                        │
│  HealthRecord    │◄─┤  Tutor · Provider · Pet                │
│  PassportShare   │  │  Location · Schedule · ServiceArea     │
│                  │  │                                        │
│  Cron diario     │  │  Supabase Storage (pets, providers)    │
│  Edge Functions  │  │  PostGIS (locations)                   │
│  Resend + Push   │  │                                        │
└──────────────────┘  └────────────┬───────────────────────────┘
                                   │ Pet + Location (consume)
                      ┌────────────┴───────────────────────────┐
                      │                                        │
           ┌──────────▼───────┐              ┌─────────────────▼───────┐
           │  BC-04 · COMUNI- │              │  BC-05 · MARKETPLACE    │
           │  DAD Y PERDIDAS  │              │                         │
           │                  │              │  Booking                │
           │  LostReport      │              │  BookingStatusEvent     │
           │  Location        │              │                         │
           │                  │              │  PostGIS ST_DWithin     │
           │  PostGIS 5/3 KM  │              │  Mercado Pago Escrow    │
           │  Web Push masivo │              │  Web Push / Confirmac.* │
           │  Motor matches   │              │                         │
           └──────────────────┘              └─────────────────────────┘
```

**Dependencias de servicios externos por contexto:**

```
BC-01 ──► Supabase Auth, Resend (verificación)
BC-02 ──► Supabase Storage, PostGIS, API Geolocalización nativa
BC-03 ──► Supabase Edge Functions, Resend, Web Push API
BC-04 ──► PostGIS, Web Push API, Supabase Edge Functions, API Geolocalización nativa
BC-05 ──► PostGIS, Mercado Pago Marketplace
```

---

## 4. Módulos por Bounded Context

### BC-01 — Identidad y Acceso

| Módulo | Descripción | Fase |
|---|---|---|
| **Auth Tutor** | Registro, OAuth 2.0, verificación email | 1 |
| **Auth Proveedor** | Registro diferenciado, flujo de selección de rol (roles acumulables · RFC-002) | 1 |
| **Acceso y Permisos de Admin** | Área `/admin`, `has_role('admin')`, asignación de rol admin (HU-018) | 1 |
| **Panel y Monitoreo** | Dashboard de métricas y transacciones (HU-019) | 1 / 2 |
| **Aprobación de Proveedores** | Transición pending_approval → active, sello "Verificado" (HU-020) | 1 |
| **Moderación de la Comunidad** | Ocultar/cerrar reportes inadecuados (HU-021) | 1 |

---

### BC-02 — Gestión de Perfiles

| Módulo | Descripción | Fase |
|---|---|---|
| **Perfil Tutor** | Nombre, ubicación barrio/zona, avatar, teléfono, banner de progreso | 1 |
| **Perfil Mascota** | CRUD de mascota con eliminación lógica | 1 |
| **Perfil Proveedor** | Datos comerciales, CUIT/DNI, categorías, cobertura | 1 |
| **Galería Proveedor** | Hasta 6 fotos en bucket `providers` | 1 |
| **Horarios Proveedor** | Grilla semanal de bloques de 30 minutos | 1 |

---

### BC-03 — Pasaporte Digital de Salud

| Módulo | Descripción | Fase |
|---|---|---|
| **Vacunación** | Registro con tipos fijos, fechas y alerta visual < 30 días | 1 |
| **Desparasitaciones** | Registro con cálculo automático de next_due_date | 1 |
| **Alertas de Salud** | Cron diario, envío a 30/7/0 días, snooze +7 días | 1 |
| **Historial Clínico** | Consultas con adjuntos (3 archivos, 5 MB c/u), timeline | 1 |
| **Pasaporte Compartido** | Enlace hash público, solo lectura, TTL 7 días | 1 |

---

### BC-04 — Comunidad y Mascotas Perdidas

| Módulo | Descripción | Fase |
|---|---|---|
| **Reporte de Pérdida** | Formulario geolocalizado, ciclo lost→found→closed | 1 |
| **Mapa Comunitario** | Mapa público con pines, filtros especie/fecha, radios 5/10/20 KM | 1 |
| **Reporte de Encontrada** | Formulario simplificado público por ciudadano anónimo | 1 |
| **Motor de Coincidencias** | Matching automático especie/raza/color en radio 3 KM | 1 |
| **Cierre de Reporte** | Transición a found, publicación automática en feed* | 1 |

---

### BC-05 — Marketplace Transaccional

| Módulo | Descripción | Fase |
|---|---|---|
| **Búsqueda de Proveedores** | ST_DWithin + filtros categoría/especie/precio/rating | 2 |
| **Agenda y Disponibilidad** | Vista de slots libres basada en schedules del Proveedor | 2 |
| **Reserva de Turno** | Booking con procesamiento de pago y escrow* | 2 |
| **Verificación de Servicio** | Liberación de fondos al Proveedor tras confirmación* | 2 |

---

## 5. Entidades Principales

### Entidades de dominio

| Entidad | Bounded Context | Descripción | Tabla |
|---|---|---|---|
| **User** | BC-01 | Identidad base. Sus roles viven en `user_roles` (RFC-002) | `users` |
| **UserRole** | BC-01 | Rol asignado a un usuario (tutor/provider/admin). Permite roles múltiples (RFC-002) | `user_roles` |
| **Tutor** | BC-02 | Perfil extendido del User dueño de mascotas (`full_name`, `phone`, `avatar_url`, `location_id` — RFC-001) | `users` (columnas de perfil) + `locations` |
| **PushSubscription** | BC-01 / transversal | Suscripción Web Push por dispositivo del usuario (RFC-001) | `push_subscriptions` |
| **AdminAuditLog** | BC-01 / Admin | Registro inmutable de acciones del Admin (RFC-003) | `admin_audit_log` |
| **Provider** | BC-02 | Entidad comercial. Estado: pending_approval / active | `providers` |
| **Pet** | BC-02 | Perfil digital de la mascota. Eliminación lógica | `pets` |
| **Location** | BC-02 | Punto geoespacial compartido. GEOGRAPHY(POINT) | `locations` |
| **Schedule** | BC-02 | Grilla semanal de disponibilidad del Proveedor | `schedules` |
| **ServiceArea** | BC-02 | Polígono de cobertura granular del Proveedor | `service_areas` |
| **HealthRecord** | BC-03 | Registro unificado de vacuna, desparasitación o consulta | `health_records` |
| **PassportShare** | BC-03 | Enlace público temporal del pasaporte de salud | `passport_shares` |
| **LostReport** | BC-04 | Reporte de pérdida o hallazgo con ciclo de vida | `lost_reports` |
| **Booking** | BC-05 | Reserva entre Tutor y Proveedor | `bookings` |
| **BookingStatusEvent** | BC-05 | Auditoría inmutable de transiciones de reserva | `booking_status_events` |

### Relaciones entre entidades

```
User ──(1:N)──► UserRole (tutor/provider/admin acumulables · RFC-002)
User ──(1:1)──► Tutor profile (full_name, phone, avatar_url, location_id en `users` · RFC-001)
User ──(1:1)──► Provider profile (datos comerciales)
User ──(1:N)──► Pet
User ──(1:N)──► PushSubscription (varios dispositivos · RFC-001)
User (admin) ──(1:N)──► AdminAuditLog (acciones auditadas · RFC-003)

Pet ──(1:N)──► HealthRecord (vacunas, desparasitaciones, consultas)
Pet ──(1:N)──► PassportShare
Pet ──(0:N)──► Booking
Pet ──(0:N)──► LostReport (vinculación opcional)

Provider ──(1:N)──► Schedule (grilla semanal)
Provider ──(1:N)──► ServiceArea (cobertura granular)
Provider ──(1:1)──► Location
Provider ──(1:N)──► Booking

Booking ──(1:N)──► BookingStatusEvent
LostReport ──(1:1)──► Location
User (Tutor) ──(1:1)──► Location   (respaldada por `users.location_id` · RFC-001)
```

> **RFC-001:** la relación `User (Tutor) ──► Location` quedaba afirmada en este mapa pero el esquema no la implementaba. Con RFC-001, `users.location_id` (FK → `locations.id`) la materializa, habilitando el origen geoespacial de HU-016.

---

## 6. Dependencias entre Bounded Contexts

### Mapa de dependencias (quién consume a quién)

| Consumidor | Proveedor | Dato consumido | Dirección |
|---|---|---|---|
| BC-02 Perfiles | BC-01 Identidad | `user_id`, `role` | BC-01 → BC-02 |
| BC-03 Salud | BC-01 Identidad | Sesión autenticada | BC-01 → BC-03 |
| BC-03 Salud | BC-02 Perfiles | `pet_id` | BC-02 → BC-03 |
| BC-04 Comunidad | BC-01 Identidad | `user_id`, ubicación para push | BC-01 → BC-04 |
| BC-04 Comunidad | BC-02 Perfiles | `pet_id` (vinculación opcional), `Location` | BC-02 → BC-04 |
| BC-05 Marketplace | BC-01 Identidad | `user_id` de Tutor y Proveedor | BC-01 → BC-05 |
| BC-05 Marketplace | BC-02 Perfiles | `Provider`, `Pet`, `Schedule`, `Location`, `ServiceArea` | BC-02 → BC-05 |

**Regla derivada del SDD:** BC-01 es el contexto raíz. Ningún otro contexto puede operar sin que BC-01 haya provisto una identidad válida (excepto los módulos públicos: mapa HU-013, formulario HU-014 y pasaporte compartido HU-011).

### Módulos públicos (sin dependencia de BC-01)

| Módulo | Bounded Context | HU |
|---|---|---|
| Mapa comunitario | BC-04 | HU-013 |
| Reporte de mascota encontrada | BC-04 | HU-014 |
| Enlace de pasaporte compartido | BC-03 | HU-011 (`/passport/{hash}`) |

---

## 7. Servicios Externos por Bounded Context

| Servicio Externo | BC-01 | BC-02 | BC-03 | BC-04 | BC-05 |
|---|---|---|---|---|---|
| Supabase Auth | ✓ | — | — | — | — |
| Supabase Storage | — | ✓ | ✓ | ✓ | — |
| Supabase Edge Functions | — | — | ✓ | ✓ | — |
| PostGIS (`ST_DWithin`) | — | ✓ | — | ✓ | ✓ |
| Resend (email) | ✓ | — | ✓ | — | — |
| Web Push API | — | — | ✓ | ✓ | — |
| API Geolocalización nativa | — | ✓ | — | ✓ | ✓ |
| Mercado Pago Marketplace | — | — | — | — | ✓ |

---

## 8. Roadmap de Activación de Contextos

| Fase | Contextos activos | Contextos inactivos |
|---|---|---|
| **Fase 1 — MVP** | BC-01 completo, BC-02 completo, BC-03 completo, BC-04 completo | BC-05 inactivo |
| **Fase 2 — Marketplace** | Todos activos | — |
| **Fase 3 — Expansión** | Todos activos + extensión geográfica de BC-02 y BC-05 | — |

**Nota de diseño:** BC-02 prepara en Fase 1 los datos que BC-05 consumirá en Fase 2. Los horarios (HU-006) y la geolocalización de Proveedores (HU-005) se capturan en Fase 1 precisamente para que la búsqueda (HU-016) y la reserva (HU-017) estén habilitadas en Fase 2 sin necesidad de migración de datos.
