# Guía de Trabajo para el Equipo de Desarrollo — APPATITAS

> **Uso:** Este documento es exclusivamente para consulta de los 3 desarrolladores.
> No debe ser procesado ni invocado por herramientas de IA.
> La fuente de verdad técnica permanece en `docs/SDD_MASTER.md` y el corpus normativo definido en `docs/SDD_LOCK.md`.

---

## Roles del Equipo

### Dev 1 — Infraestructura y Datos

**Foco:** Base de datos, migraciones, RLS, Edge Functions de sistema, seguridad.

Responsabilidades permanentes:
- Todas las migraciones de Supabase.
- Todas las políticas de Row Level Security.
- Stores de Pinia que encapsulan queries complejas.
- Revisión de performance de queries PostGIS.
- Revisión final de seguridad en cada sprint.

### Dev 2 — Producto y Experiencia de Usuario

**Foco:** Páginas, componentes Vue, flujos de usuario, UI/UX.

Responsabilidades permanentes:
- Todas las páginas (`*Page.vue`) por HU.
- Todos los componentes reutilizables (`*Card.vue`, `*Form.vue`, etc.).
- Integración de servicios TypeScript en la UI.
- Asegurarse de que los flujos del SDD se traduzcan correctamente en la UI.

### Dev 3 — Integraciones y Servicios Externos

**Foco:** Edge Functions de integración, servicios de terceros, notificaciones.

Responsabilidades permanentes:
- Toda integración con Mercado Pago.
- Toda integración con Resend (email).
- Web Push API: service worker, VAPID, registro de tokens.
- Edge Functions de notificaciones y webhooks.
- Tests de integración contra servicios externos en staging.

---

## Convenciones de equipo

### Ramas

```
main          → producción
staging       → integración previa a producción
sprint/N      → rama del sprint activo (ej: sprint/1)
feature/SXXX  → rama de tarea individual (ej: feature/S1-01)
```

Flujo: `feature/S1-01` → PR → `sprint/1` → revisión → `staging` → `main`.

### Pull Requests

- Mínimo 1 revisión de otro dev antes de mergear a `sprint/N`.
- El PR debe referenciar la tarea (ej: `Closes S1-01`).
- Cada PR que modifique esquema de BD debe incluir la migración correspondiente.
- Cada PR que modifique documentos normativos debe referenciar el RFC aprobado.

### Migrations

- Archivo por cambio, no batch. Ej: `0014_rls_sprint1.sql`, `0015_alert_prefs.sql`.
- Nunca modificar una migración ya aplicada en staging. Crear nueva.

### Testing (RFC-004 / ADR-007)

- **Vitest** para tests unitarios (`tests/unit/**/*.spec.ts`) — lógica pura y componentes Vue.
- **Playwright** para tests e2e (`tests/e2e/**/*.e2e.ts`) — flujos completos en el navegador.
- Scripts: `npm run test` (unit), `npm run test:watch`, `npm run test:e2e`.
- Antes del primer e2e: `npx playwright install chromium`.
- **Definition of Done:** cada HU incorpora al menos 1 test de su flujo principal antes de mergear.
- **Guía práctica** (cómo correr, escribir con ayuda de IA y qué probar en cada sprint): `docs/testing.md`.

---

## Sprint 0 — Infraestructura base (1 semana)

> **Responsable** = dev **líder** de la tarea. La carga se reparte por sprint respetando el rol de cada uno (Dev 1 datos · Dev 2 frontend · Dev 3 integraciones); si un sprint queda desbalanceado, se deslinda alguna tarea a otro dev. El detalle de quién hizo cada parte vive en **Estado por parte**.

| Tarea | Descripción | Responsable |
|---|---|---|
| S0-01 | Inicializar proyecto Supabase, configurar `supabase/config.toml` | Dev 1 |
| S0-02 | Crear las 14 tablas con columnas, tipos y constraints (incl. `push_subscriptions`, `user_roles`, `admin_audit_log` y perfil Tutor en `users` · RFC-001/002/003) | Dev 1 |
| S0-03 | Extensión PostGIS + índice GIST sobre `locations.coordinates` | Dev 1 |
| S0-04 | Configurar Supabase Auth (email/contraseña, Google OAuth, Facebook OAuth) | Dev 3 |
| S0-05 | Inicializar PWA: manifest, service worker, instalación A2HS | Dev 2 |
| S0-06 | Configurar buckets de Storage (avatars, pets, health-records, providers) | Dev 3 |
| S0-07 | Integrar Resend: dominio verificado, función utilitaria `sendEmail` | Dev 3 |

**Entregable de Sprint 0:** entorno de staging funcional, todas las tablas vacías creadas, buckets configurados, OAuth con al menos Google funcionando, email de prueba enviado con Resend.

### Estado por parte (al 2026-09-27)

| Parte | Estado | Dev(s) |
|---|---|---|
| Proyecto Supabase + `config.toml` (S0-01) | Hecho | Dev 1 |
| 14 tablas + tipos + constraints (S0-02) | Hecho | Dev 1 |
| PostGIS + índice GIST (S0-03) | Hecho | Dev 1 |
| Supabase Auth: email + Google (Facebook diferido) (S0-04) | Hecho | Dev 3 |
| Scaffold PWA + Web App Manifest + Service Worker base (S0-05) | Hecho | Dev 2 |
| Web Push en el Service Worker (recepción/click) | Hecho | Dev 3 |
| Buckets de Storage (avatars/pets/health-records/providers) (S0-06) | Hecho | Dev 1 (receta) + Dev 3 (creación en staging) |
| Resend: dominio + `sendEmail` (S0-07) | Hecho | Dev 3 |

---

## Sprint 1 — Identidad y Perfiles Base (2 semanas)

**HU:** HU-001 · HU-002 · HU-003 · HU-004

| Tarea | Descripción | Responsable |
|---|---|---|
| **S1-01** Auth Tutor | Trigger Auth→`users`/`user_roles` + RLS; RegisterPage, LoginPage, EmailVerifyPage, OAuthButtons; verificación por Resend + Google/Facebook OAuth | Dev 3 |
| **S1-02** Perfil Tutor | Guards en router, `auth.store`, RLS users; TutorProfilePage, ProfileBanner, PhotoUploader | Dev 2 |
| **S1-03** Registro Mascota | `pet.store`, filtro `deleted_at`, RLS pets; PetListPage, PetFormPage (alta), PetCard | Dev 2 |
| **S1-04** Edición/baja Mascota | RPC baja lógica atómica (pets + cascada bookings); PetFormPage (edición), ConfirmDeleteModal | Dev 1 |
| **Cierre** | RLS definitivas users/pets + migración; integración completa del flujo + pruebas en staging | Dev 1 |

**Dependencia crítica de Dev 2 sobre Dev 1:** Dev 2 no puede integrar login sin el trigger de Auth. Día 1: Dev 1 prioriza el trigger.

**Decisión pendiente para este sprint (equipo completo):**
- GAP-004 (✅ resuelto por RFC-002): un usuario **sí** puede ser Tutor y Proveedor; los roles viven en `user_roles`. La UI necesita un selector de "rol activo".

### Estado por parte (al 2026-09-27)

| Parte | Estado | Dev(s) |
|---|---|---|
| Trigger de alta `auth → users + user_roles` (mig. 020) | Hecho | Dev 3 |
| RPC `soft_delete_pet` (mig. 021) | Hecho | Dev 1 |
| Tipos generados conformes + `config.toml` | Hecho | Dev 1 |
| RLS `users` / `user_roles` / `pets` | Hecho | Dev 1 |
| `auth.store` / `pet.store` (base) | Hecho | Dev 1 (base) + Dev 2 (extensión) |
| Router + guards (sesión + email verificado, RN-004) | Hecho | Dev 2 |
| HU-001 registro/login/verificación (pages + `auth.service`) | Hecho | Dev 2 |
| HU-002 perfil de Tutor | Hecho | Dev 2 |
| HU-003 / HU-004 alta, edición y baja de mascota (UI) | Hecho | Dev 2 |
| Aplicar migraciones a staging (dejar el trigger 020 activo) | Pendiente | Dev 1 |
| Corregir bug en `soft_delete_pet` (`pet_id` ambiguo) | Pendiente | Dev 1 |
| Verificar entrega del email de verificación (Resend) | Pendiente | Dev 3 |
| Activar Facebook OAuth | Diferido (feature flag) | Dev 3 |

Detalle de los pendientes en `docs/handoff-dev2-sprint1.md`.

---

## Sprint 2 — Pasaporte Digital de Salud (2 semanas)

**HU:** HU-007 · HU-008 · HU-009 · HU-010 · HU-011

| Tarea | Descripción | Responsable |
|---|---|---|
| **S2-01** Vacunas | RLS health_records + push_subscriptions; HealthDashboardPage, VaccinationFormPage, VaccineAlert | Dev 2 |
| **S2-02** Desparasitaciones | Migración `alert_preferences` (JSONB); DewormingFormPage con cálculo automático de `next_due_date` | Dev 2 |
| **S2-03** Historial clínico | RLS bucket health-records + query de timeline; ClinicalVisitFormPage, HealthTimeline, AttachmentUploader | Dev 1 |
| **S2-04** Alertas de salud | RPC snooze (UPDATE atómico); AlertsSettingsPage + integración del snooze; Edge Function health-alerts-cron + Resend + permiso/registro de push en la PWA | Dev 3 |
| **S2-05** Pasaporte | RLS passport_shares (anon con expiración) + hash pgcrypto; PassportPage + PassportShareCard + ruta pública /passport/:hash; pruebas Web Push A2HS | Dev 1 |

**Dependencia crítica de Dev 3 sobre Dev 1:**
Dev 3 no puede probar el cron sin la tabla `push_subscriptions` (creada en Sprint 0 por RFC-001) y su RLS. Dev 1 prioriza la RLS de `push_subscriptions` en Día 1.

**Decisión pendiente (equipo completo):**
- GAP-010: ¿qué categorías de alerta además de vacunación y desparasitación? Definir antes de implementar el panel.

### Estado por parte (al 2026-09-27, en curso)

Trabajo ya realizado que condiciona el reparto:

| Parte | Estado | Dev(s) |
|---|---|---|
| Registro de suscripción push en el cliente (`src/lib/push.ts`) | Hecho | Dev 3 |
| Tablas `health_records` / `passport_shares` / `push_subscriptions` + RLS | Hecho | Dev 1 |
| Migración `alert_preferences` (JSONB en `users`) | Pendiente | Dev 1 |
| RPC de snooze (`next_due_date += 7 días`, RN-007) | Pendiente | Dev 1 |
| Edge Function `health-alerts-cron` | Pendiente | Dev 3 |
| Pruebas Web Push A2HS (Android/iOS) | Pendiente | Dev 3 |
| HU-007 vacunas (pages + `health.service`) | Pendiente | Dev 2 |
| HU-008 desparasitaciones (cálculo `next_due_date`) | Pendiente | Dev 2 |
| HU-010 historial clínico + adjuntos (bucket health-records) | Pendiente | Dev 2 |
| HU-011 pasaporte compartido (autenticado + público `/passport/:hash`) | Pendiente | Dev 2 |
| HU-009 panel de config + cableado del push existente + listener de snooze | Pendiente | Dev 2 |

Nota: el registro de push (S2-04) ya está hecho por Dev 3; Dev 2 lo integra a la UI en vez de reimplementarlo.

---

## Sprint 3 — Comunidad y Mascotas Perdidas (2 semanas)

**HU:** HU-012 · HU-013 · HU-014 · HU-015

| Tarea | Descripción | Responsable |
|---|---|---|
| **S3-01** Reporte perdida | RLS lost_reports + migración feed_events; LostPetFormPage (mascota propia o anónima); Edge Function lost-pet-notify (ST_DWithin 5KM, batch 100, throttle 500) | Dev 3 |
| **S3-02** Mapa comunitario | Verificar índice GIST para el mapa; CommunityMapPage, LostPetPin, LostPetCard, RadiusSelector, SpeciesFilter | Dev 2 |
| **S3-03** Reporte encontrada | Verificar RLS con user_id nullable; FoundPetFormPage (sin auth) + integración del motor de coincidencias; Edge Function found-pet-match (species exacto + color ILIKE + ST_DWithin 3KM) | Dev 3 |
| **S3-04** Cierre de reporte | RLS (solo propietario UPDATE status); ReportDetailPage con "¡La encontré!" + ReportStatusBadge; Edge Function report-closed → INSERT feed_events | Dev 2 |
| **Cierre** | Prueba de autorización (anónimo no cierra reporte ajeno); flujo lost→found integrado; simular push masivo + verificar matching | Dev 1 |

**Dependencia crítica de Dev 2 sobre Dev 3:**
El botón "Tengo información" en LostPetCard (Dev 2) puede usarse antes de que el motor de matching (Dev 3) esté listo. Desacoplar: el botón abre WhatsApp/teléfono de contacto independientemente del motor.

**Decisiones pendientes (equipo completo):**
- GAP-011: throttle de 500 destinatarios — ¿es aceptable para el Product Owner?
- GAP-015: ¿el feed de zona tendrá UI en Fase 1 o solo el evento en tabla? Confirmarlo antes de S3-04.

### Estado por parte (al 2026-09-27) — sprint no iniciado

| Parte | Estado | Dev(s) |
|---|---|---|
| HU-012 reporte de mascota perdida (UI) | Pendiente | Dev 2 |
| HU-013 mapa comunitario (UI) | Pendiente | Dev 2 |
| HU-014 reporte de encontrada (UI) | Pendiente | Dev 2 |
| HU-015 cierre de reporte (UI) | Pendiente | Dev 2 |
| RLS `lost_reports` + migración `feed_events` | Pendiente | Dev 1 |
| Edge Functions `lost-pet-notify` / `found-pet-match` / `report-closed` | Pendiente | Dev 3 |

---

## Sprint 4 — Perfiles Comerciales de Proveedores (2 semanas)

**HU:** HU-005 · HU-006

| Tarea | Descripción | Responsable |
|---|---|---|
| **S4-01** Registro Proveedor | RLS providers/service_areas + ST_Buffer + migración gallery_urls; ProviderRegisterPage (formulario + zona), ServiceAreaMap, ProviderStatusBadge; Edge Function mp-provider-onboarding (OAuth MP + mp_user_id) | Dev 3 |
| **S4-02** Galería | RLS bucket providers + COUNT < 10 en backend; GalleryManagerPage, GalleryGrid (reordenable), GalleryUploader; probar onboarding MP sandbox | Dev 2 |
| **S4-03** Horarios | RLS schedules + integridad de slots; ScheduleManagerPage, WeeklyScheduleEditor | Dev 2 |
| **Cierre** | Proveedor de prueba aprobado en staging; ProviderProfilePage + integración completa; verificar mp_user_id tras callback OAuth | Dev 1 |

**Dependencia crítica para Sprint 5:**
Al cierre de Sprint 4 debe existir al menos 1 Proveedor activo con schedules cargados. Dev 1 ejecuta el UPDATE manual de staging.

**Decisiones pendientes (equipo completo):**
- GAP-005 (✅ resuelto por RFC-003): el panel Admin existe como HU-018..021. La aprobación de Proveedores es HU-020. Priorizar HU-018 + HU-020 para no bloquear Sprint 5.
- GAP-003: ¿qué documentación se le pide al Proveedor para verificación? Definir antes del Día 1 del sprint.

### Estado por parte (al 2026-09-27) — sprint no iniciado

| Parte | Estado | Dev(s) |
|---|---|---|
| HU-005 registro de Proveedor (UI) | Pendiente | Dev 2 |
| HU-006 galería + horarios (UI) | Pendiente | Dev 2 |
| RLS `providers` / `service_areas` / `schedules` + migración `gallery_urls` | Pendiente | Dev 1 |
| Edge Function `mp-provider-onboarding` | Pendiente | Dev 3 |
| Aprobación de Proveedores (HU-020, ver Módulo de Administración) | Pendiente | Dev 1 + Dev 2 |

---

## Sprint 5 — Marketplace Transaccional (2 semanas)

**HU:** HU-016 · HU-017

⚠️ **Este sprint no comienza hasta que los 4 gaps críticos estén resueltos por RFC:**
GAP-001 (criterios de HU-017) · GAP-002 (comisión) · GAP-003 (liberación de fondos) · GAP-007 (estados de booking).

| Tarea | Descripción | Responsable |
|---|---|---|
| **S5-01** Búsqueda | RLS bookings/booking_status_events + UNIQUE(provider_id, scheduled_at); SearchPage con filtros, ProviderCard, ProviderDetailPage | Dev 2 |
| **S5-02** Disponibilidad | Verificar UNIQUE vs slots cancelados + query de slots; AvailabilityPage, SlotPicker | Dev 2 |
| **S5-03** Reserva y pago | Anti-concurrencia + INSERT booking/booking_status_events; BookingCheckoutPage, PaymentRedirectButton, BookingSuccessPage, BookingListPage, BookingStatusTimeline; Edge Functions mp-create-payment / mp-payment-webhook / booking-expiry-cron | Dev 3 |
| **Cierre** | Prueba de concurrencia (2 requests al mismo slot); flujo completo de cancelación y estados; e2e de pago aprobado/rechazado/expirado | Dev 1 |

### Estado por parte (al 2026-09-27) — no iniciado y bloqueado

Bloqueado por los gaps críticos GAP-001/002/003/007 (ver aviso arriba).

| Parte | Estado | Dev(s) |
|---|---|---|
| HU-016 búsqueda de Proveedores (UI) | Pendiente / bloqueado | Dev 2 |
| HU-017 disponibilidad + reserva (UI) | Pendiente / bloqueado | Dev 2 |
| RLS `bookings` / `booking_status_events` + constraint anti-doble-reserva | Pendiente / bloqueado | Dev 1 |
| Edge Functions `mp-create-payment` / `mp-payment-webhook` / `booking-expiry-cron` | Pendiente / bloqueado | Dev 3 |
| Resolver gaps críticos GAP-001/002/003/007 | Pendiente | Equipo / Negocio |

---

## Módulo de Administración (HU-018 a HU-021 · RFC-003)

El Admin es transversal. Reparto sugerido (detalle en `docs/technical-backlog.md` → Módulo de Administración):

| Tarea | HU | Sprint | Descripción | Responsable |
|---|---|---|---|---|
| Acceso y permisos de Admin | HU-018 | 1 | `has_role()`, RLS de `user_roles`/`admin_audit_log`, asignación manual del primer admin; guard de `/admin` + pantalla de acceso denegado | Dev 1 |
| Aprobación de Proveedores | HU-020 | 4 | UPDATE seguro de `providers` + INSERT `admin_audit_log` (RPC); pantalla `/admin/proveedores` (aprobar/rechazar, sello Verificado) | Dev 1 |
| Moderación de la comunidad | HU-021 | 3 | UPDATE de `lost_reports` por moderación + audit; cola de moderación `/admin/moderacion` | Dev 2 |
| Panel y monitoreo | HU-019 | 1 (base) / 5 (transacciones) | Vistas/consultas agregadas; dashboard de métricas y reservas | Dev 2 |

> **Primer admin:** Dev 1 inserta manualmente `('<uuid>', 'admin')` en `user_roles` (vía SQL/Studio) para la cuenta del equipo. El rol admin nunca es autoservicio.

### Estado por parte (al 2026-09-27) — no iniciado

| Parte | Estado | Dev(s) |
|---|---|---|
| HU-018 acceso/permisos de Admin (guard `/admin`, `has_role`) | Pendiente | Dev 1 + Dev 2 |
| HU-019 panel y monitoreo | Pendiente | Dev 1 + Dev 2 |
| HU-020 aprobación de Proveedores | Pendiente | Dev 1 + Dev 2 |
| HU-021 moderación de la comunidad | Pendiente | Dev 1 + Dev 2 |

Nota: `has_role()` ya existe (Dev 1); ninguna pantalla de Admin (Dev 2) está construida aún.

---

## Matriz de dependencias críticas entre devs

| Sprint | Dev 1 debe terminar esto primero | Para que Dev 2/3 pueda |
|---|---|---|
| Sprint 1, Día 1 | Trigger Auth→`public.users` + `user_roles` (RFC-002) y función `has_role()` | Dev 2: integrar el formulario de login y el rol activo |
| Sprint 2, Día 1 | RLS de `push_subscriptions` (tabla creada en Sprint 0 · RFC-001) | Dev 3: registrar suscripciones y enviar push en el cron |
| Sprint 2, Día 3 | RLS bucket health-records | Dev 2: subir adjuntos clínicos |
| Sprint 3, Día 1 | RLS lost_reports | Dev 2: publicar reportes de pérdida |
| Sprint 4, Día 1 | RLS providers + migración gallery_urls | Dev 2: formulario de registro de Proveedor |
| Sprint 4, cierre | Aprobar Proveedor vía HU-020 (o SQL como contingencia) | Sprint 5: tener datos con qué probar |
| Sprint 5, Día 1 | UNIQUE constraint en bookings | Dev 3: no hay riesgo de doble reserva |

---

## Decisiones de negocio que el equipo NO puede tomar solo

El equipo debe detener la implementación de las tareas afectadas hasta que estas decisiones lleguen del área comercial o del Product Owner:

| Decisión | Bloquea | Quién decide |
|---|---|---|
| GAP-002: % de comisión de APPATITAS | Todo Sprint 5 | Comercial / Legal |
| GAP-003: criterio de liberación de fondos al Proveedor | Sprint 5, pago | Product Owner + Mercado Pago |
| GAP-001: criterios de aceptación de HU-017 | Sprint 5 completo | Product Owner |
| GAP-010: categorías de alertas de salud | Sprint 2 (panel de configuración) | Product Owner / Veterinario consultor |

**Ya resueltas (vía RFC):**

| Decisión | Resolución |
|---|---|
| GAP-004: ¿usuario puede ser Tutor Y Proveedor? | ✅ RFC-002 — sí, roles múltiples en `user_roles` |
| GAP-005: ¿Admin con panel y capacidades? | ✅ RFC-003 — HU-018..021 + `admin_audit_log` |

---

## Gestión de Gaps en el día a día

Cuando un desarrollador encuentra un gap durante la implementación:

1. **Detener** la implementación del item afectado.
2. **Notificar** al equipo en el canal de comunicación del sprint.
3. Si el gap ya está en `docs/GAP_ANALYSIS.md`: referenciar el GAP-XXX.
4. Si el gap es nuevo: crear una entrada en `docs/GAP_ANALYSIS.md` antes de seguir.
5. Implementar con la **decisión provisional** documentada en el sprint plan correspondiente, marcando con un comentario `// TODO: GAP-XXX` en el código.
6. Cuando el gap se resuelva, abrir un RFC, actualizar el SDD, luego actualizar el código.

---

## Guía rápida de archivos por rol

### Dev 1 siempre toca:
- `supabase/migrations/*.sql`
- `supabase/config.toml`
- `src/stores/*.store.ts` (lógica de datos)
- `docs/architecture/database.md` (si hay cambios de esquema)
- `docs/architecture/security.md` (si hay cambios de RLS)

### Dev 2 siempre toca:
- `src/bc*/pages/*.vue`
- `src/bc*/components/*.vue`
- `src/router/index.ts` y `guards.ts`
- `src/bc*/services/*.ts` (integración de Supabase client con la UI)

### Dev 3 siempre toca:
- `supabase/functions/*/index.ts`
- `public/service-worker.js`
- `public/manifest.json`
- Variables de entorno relacionadas con servicios externos (`.env.local`, secrets de Supabase)

---

## Contacto y escalada

- Cualquier conflicto de interpretación del SDD → leer `docs/SDD_MASTER.md` primero.
- Si el SDD no resuelve la duda → consultar `docs/GAP_ANALYSIS.md`.
- Si el gap no está documentado → documentarlo, notificar al equipo, esperar resolución.
- No inventar reglas de negocio. No asumir. Preguntar.
