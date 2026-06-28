# SDD LOCK — APPATITAS
**Versión bloqueada:** 1.3
**Fecha de bloqueo:** Mayo 2025 · Actualizado 2026-06-25 (RFC-001, RFC-002, RFC-003 aprobados)
**Estado:** ACTIVO

---

## ⚠️ Este documento es normativo y de cumplimiento obligatorio.

Ningún miembro del equipo puede iniciar implementación, modificar esquemas de base de datos, agregar endpoints, cambiar modelos de datos o alterar decisiones arquitectónicas sin seguir el proceso de cambio definido en este documento.

---

## 1. Corpus Normativo — Versión 1.3

Los siguientes documentos constituyen la fuente de verdad del sistema en su versión 1.3. Están bloqueados a la fecha indicada. Toda implementación debe validarse contra este corpus antes de ejecutarse.

| Documento | Ruta | Propósito | Estado |
|---|---|---|---|
| **SDD Master** | `docs/SDD_MASTER.md` | Historias de usuario, modelo de negocio, roadmap | 🔒 Bloqueado v1.2 (RFC-002/003) |
| **Reglas de Negocio** | `docs/business-rules.md` | RN-001 a RN-026. Fuente de verdad de restricciones | 🔒 Bloqueado v1.0 |
| **Trazabilidad** | `docs/traceability.md` | Matriz HU → Reglas → Tablas → APIs → UI | 🔒 Bloqueado v2.2 (RFC-001/002/003) |
| **Mapa de Dominio** | `docs/domain-map.md` | Bounded Contexts, módulos, entidades, dependencias | 🔒 Bloqueado v1.2 (RFC-001/002/003) |
| **Arquitectura de BD** | `docs/architecture/database.md` | Esquema de tablas, columnas, relaciones | 🔒 Bloqueado v1.3 (RFC-001/002/003) |
| **Arquitectura de Seguridad** | `docs/architecture/security.md` | Auth, RLS, datos sensibles, storage | 🔒 Bloqueado v1.1 (RFC-002/003) |
| **Arquitectura del Sistema** | `docs/system-architecture.md` | Capas, flujos, diagramas, tecnologías | 🔒 Bloqueado v1.2 (RFC-001/002/003) |
| **Backlog Técnico** | `docs/technical-backlog.md` | Orden de desarrollo por dependencias | 🔒 Bloqueado v1.1 (RFC-002/003) |
| **RFC-001** | `docs/rfcs/RFC-001-perfil-tutor-y-push-subscriptions.md` | Perfil del Tutor en `users` + tabla `push_subscriptions` | 🔒 Aprobado (2026-06-25) |
| **RFC-002** | `docs/rfcs/RFC-002-roles-multiples-por-usuario.md` | Roles múltiples vía `user_roles` (GAP-004) | 🔒 Aprobado (2026-06-25) |
| **RFC-003** | `docs/rfcs/RFC-003-actor-administrador.md` | Actor Admin (HU-018..021) + `admin_audit_log` (GAP-005) | 🔒 Aprobado (2026-06-25) |
| **ADR-001** | `docs/adrs/ADR-001-supabase.md` | Supabase como plataforma backend | 🔒 Aceptado |
| **ADR-002** | `docs/adrs/ADR-002-Authentication-and-RLS.md` | Auth con Supabase Auth y RLS | 🔒 Aceptado |
| **ADR-003** | `docs/adrs/ADR-003-PostGIS-Geolocation.md` | PostGIS para geolocalización | 🔒 Aceptado |
| **ADR-004** | `docs/adrs/ADR-004-MercadoPago-Escrow.md` | Mercado Pago Marketplace como gateway | 🔒 Aceptado |
| **ADR-005** | `docs/adrs/ADR-005-PWA-Architecture.md` | PWA como arquitectura de frontend | 🔒 Aceptado |
| **ADR-006** | `docs/adrs/ADR-006-Notifications.md` | Notificaciones push y email | 🔒 Aceptado |

---

## 2. Perímetro del Sistema — Versión 1.3

### 2.1 Historias de usuario bloqueadas

Las siguientes 21 historias de usuario constituyen el alcance completo y cerrado del sistema en v1.3. No se puede implementar funcionalidad fuera de este listado sin un RFC aprobado.

| ID | Título | Fase | BC |
|---|---|---|---|
| HU-001 | Registro de Tutor | 1 | BC-01 |
| HU-002 | Completar Perfil de Tutor | 1 | BC-02 |
| HU-003 | Registro de Mascota | 1 | BC-02 |
| HU-004 | Edición y Baja de Mascota | 1 | BC-02 |
| HU-005 | Registro de Proveedor | 1 | BC-01 / BC-02 |
| HU-006 | Galería Comercial y Horarios del Proveedor | 1 | BC-02 |
| HU-007 | Control de Vacunación | 1 | BC-03 |
| HU-008 | Registro de Desparasitaciones | 1 | BC-03 |
| HU-009 | Sistema de Alertas de Salud | 1 | BC-03 |
| HU-010 | Historial Clínico y Consultas | 1 | BC-03 |
| HU-011 | Compartir Pasaporte de Salud | 1 | BC-03 |
| HU-012 | Reportar Mascota Perdida | 1 | BC-04 |
| HU-013 | Mapa Comunitario de Alertas | 1 | BC-04 |
| HU-014 | Reportar Mascota Encontrada | 1 | BC-04 |
| HU-015 | Cierre de Reporte por Éxito | 1 | BC-04 |
| HU-016 | Localización Inteligente de Prestadores | 2 | BC-05 |
| HU-017 | Reserva de Turnos y Confirmación | 2 | BC-05 |
| HU-018 | Acceso y Permisos de Administrador | 1 | BC-01 / Admin |
| HU-019 | Panel de Control y Monitoreo de Transacciones | 1 / 2 | Admin |
| HU-020 | Aprobación y Gestión de Proveedores | 1 | Admin |
| HU-021 | Moderación de Reportes de la Comunidad | 1 | Admin |

> **RFC-003 (2026-06-25):** se incorporan HU-018 a HU-021 (actor Admin), resolviendo GAP-005. Ver `docs/SDD_MASTER.md` §6.

### 2.2 Tablas de base de datos bloqueadas

Las siguientes 14 tablas constituyen el esquema autorizado. No se puede crear ninguna tabla adicional sin un RFC aprobado.

`users` · `locations` · `providers` · `pets` · `health_records` · `passport_shares` · `schedules` · `service_areas` · `lost_reports` · `bookings` · `booking_status_events` · `push_subscriptions` · `user_roles` · `admin_audit_log`

> **RFC-001 (2026-06-25):** se agrega `push_subscriptions` (suscripciones Web Push) y se enriquece `users` con `full_name`, `phone`, `avatar_url` y `location_id`.
> **RFC-002 (2026-06-25):** se retira `users.role` y se agrega `user_roles` (roles múltiples · GAP-004).
> **RFC-003 (2026-06-25):** se agrega `admin_audit_log` (auditoría inmutable de acciones del Admin · GAP-005).
> El sistema pasa de 11 a **14 tablas**. Ver `docs/architecture/database.md` §3.

### 2.3 Bounded Contexts bloqueados

`BC-01 Identidad y Acceso` · `BC-02 Gestión de Perfiles` · `BC-03 Pasaporte Digital de Salud` · `BC-04 Comunidad y Mascotas Perdidas` · `BC-05 Marketplace Transaccional`

### 2.4 Decisiones tecnológicas bloqueadas

| Decisión | Tecnología | ADR |
|---|---|---|
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | ADR-001 |
| Autenticación y autorización | Supabase Auth + Row Level Security | ADR-002 |
| Geolocalización | PostGIS (`ST_DWithin`, `ST_Distance`, `GEOGRAPHY`) | ADR-003 |
| Pagos y escrow | Mercado Pago Marketplace | ADR-004 |
| Frontend | Progressive Web App (PWA) | ADR-005 |
| Notificaciones | Resend (email) + Web Push API + Supabase Edge Functions | ADR-006 |

---

## 3. Reglas de Implementación

Las siguientes reglas aplican a cada tarea de desarrollo, sin excepción.

### REGLA-1 — Validación previa obligatoria

Antes de implementar cualquier tarea, el desarrollador debe verificar:

1. ¿La funcionalidad corresponde a una HU listada en §2.1?
2. ¿Las tablas afectadas están en la lista de §2.2?
3. ¿La tecnología usada está autorizada en §2.4?
4. ¿Existe una regla de negocio en `business-rules.md` que aplique?
5. ¿La HU tiene criterios de aceptación completos en el SDD?

Si alguna respuesta es **NO** → detener e iniciar proceso RFC.

### REGLA-2 — Prohibiciones absolutas

Está terminantemente prohibido:

- Crear tablas no listadas en §2.2.
- Crear endpoints o Edge Functions para funcionalidades no cubiertas por las HU de §2.1.
- Modificar columnas existentes sin actualizar `docs/architecture/database.md`.
- Cambiar un proveedor tecnológico listado en §2.4 sin un nuevo ADR aprobado.
- Asumir reglas de negocio no documentadas en `docs/business-rules.md`.
- Implementar funcionalidades de Fase 3 antes de que sean documentadas.
- Omitir el registro en `booking_status_events` en cualquier transición de estado de `bookings`.
- Realizar eliminaciones físicas en la tabla `pets` (solo `deleted_at` — RN-003).

### REGLA-3 — Gaps documentados no son licencia de implementación libre

Los items marcados con `*` en la documentación y registrados en `docs/GAP_ANALYSIS.md` son **áreas sin especificar**, no áreas de libre interpretación. Ante un gap:

1. Detener la implementación del item afectado.
2. Elevar el gap al equipo para definición.
3. Actualizar el SDD y los documentos normativos correspondientes.
4. Solo entonces implementar.

### REGLA-4 — Toda modificación documental es atómica con el código

Un cambio de esquema de base de datos, una nueva regla de negocio o una nueva decisión arquitectónica no puede existir solo en el código. El commit que introduce el cambio debe incluir la actualización documental correspondiente o referenciarse con un commit inmediato previo de documentación.

---

## 4. Proceso de Cambio — RFC (Request for Change)

Cualquier modificación al corpus normativo de §1 requiere un RFC. No existe excepción.

### 4.1 Tipos de cambio y nivel de aprobación requerido

| Tipo de Cambio | Documentos afectados | Aprobación requerida |
|---|---|---|
| Nueva HU o modificación de HU existente | SDD_MASTER · traceability · technical-backlog | Todo el equipo |
| Nueva regla de negocio o modificación | business-rules · traceability | Todo el equipo |
| Nueva tabla o columna | architecture/database · traceability | Dev Lead + revisión de equipo |
| Nuevo Bounded Context o entidad | domain-map · traceability | Todo el equipo |
| Cambio de proveedor tecnológico | ADR nuevo · system-architecture | Todo el equipo |
| Cambio en flujo de autenticación o RLS | architecture/security · ADR-002 | Todo el equipo |
| Nueva Edge Function | system-architecture · traceability | Dev Lead |
| Cambio en bucket de Storage | architecture/security · architecture/database | Dev Lead |

### 4.2 Formato del RFC

Un RFC debe contener como mínimo:

```
# RFC-XXX: [Título del cambio]

## Motivación
¿Por qué es necesario este cambio? ¿Qué problema resuelve?

## Cambio propuesto
Descripción precisa de qué cambia.

## HU afectadas
Lista de HU del §2.1 que se ven impactadas.

## Documentos a actualizar
Lista de archivos normativos que deben modificarse.

## Tablas afectadas
Lista de tablas del §2.2 afectadas. Si se agrega una tabla nueva, justificación.

## Reglas de negocio afectadas
Lista de RN de business-rules.md afectadas. Nuevas RN si aplica.

## Riesgos
¿Qué puede salir mal? ¿Qué regresiones potenciales existen?

## ADR requerido
¿Este cambio requiere un nuevo ADR o modificación de uno existente?
```

### 4.3 Flujo de aprobación del RFC

```
Desarrollador detecta necesidad de cambio
    │
    ▼
Redacta RFC en docs/rfcs/RFC-XXX.md
    │
    ▼
Comparte con el equipo para revisión
    │
    ▼
¿Aprobado por nivel requerido según §4.1?
    │
    ├── NO → RFC rechazado o ajustado → vuelve a revisión
    │
    └── SÍ → Actualizar documentos normativos afectados
                    │
                    ▼
              Implementar el cambio
                    │
                    ▼
              Actualizar SDD_LOCK.md
              con nueva versión del corpus
```

---

## 5. Gaps Pendientes de Resolución

Los siguientes gaps de `docs/GAP_ANALYSIS.md` están sin resolver a la fecha de bloqueo. Ninguna tarea que dependa de estos items puede considerarse implementable hasta que sean resueltos mediante RFC.

| GAP | Descripción | Sprint bloqueado | Severidad |
|---|---|---|---|
| GAP-001 | HU-017 sin criterios de aceptación | Sprint 5 | Crítica |
| GAP-002 | Porcentaje de comisión no definido | Sprint 5 | Crítica |
| GAP-003 | Verificación de servicio y liberación de fondos sin definir | Sprint 5 | Crítica |
| ~~GAP-004~~ | ~~Política de roles múltiples por usuario no definida~~ | — | ✅ **Resuelto** por RFC-002 (tabla `user_roles`) |
| ~~GAP-005~~ | ~~Sin HU de Admin para aprobación de Proveedores~~ | — | ✅ **Resuelto** por RFC-003 (HU-018..021 + `admin_audit_log`) |
| GAP-006 | Dependencia de Fase 2 embebida en HU-004 (Fase 1) | Sprint 1 | Alta |
| GAP-007 | Ciclo de vida completo de estados de reserva no documentado | Sprint 5 | Alta |
| GAP-008 | Sistema de valoraciones sin definir (rating_avg) | Sprint 5 | Alta |
| GAP-009 | Peso histórico de mascota sin tabla de origen | Sprint 2 | Alta |
| GAP-010 | Categorías del panel de alertas sin especificar | Sprint 2 | Media |
| GAP-011 | Notificaciones push masivas sin throttling | Sprint 3 | Media |
| GAP-012 | Algoritmo del motor de coincidencias sin definir | Sprint 3 | Media |
| GAP-013 | Ambigüedad entre radius_km y service_areas en HU-016 | Sprint 5 | Media |
| GAP-014 | Política de RLS no documentada | Todos | Media |
| GAP-015 | Feed de zona referenciado pero no definido | Sprint 3 | Media |
| GAP-016 | Excepciones y concurrencia en grilla de horarios | Sprint 5 | Media |
| GAP-017 | Catálogo de vacunas: enum vs tabla administrable | Sprint 2 | Baja |
| GAP-018 | Fallback de geolocalización denegada en HU-013 | Sprint 3 | Baja |
| GAP-019 | Recompensa en ARS: informativa o gestionada | Sprint 3 | Baja |

---

## 6. Historial de Versiones del Corpus

| Versión | Fecha | Cambios principales |
|---|---|---|
| **1.0** | Mayo 2025 | Versión inicial del SDD |
| **1.1** | Mayo 2025 | Tabla `locations` reutilizable · Enriquecimiento de `providers` (`billing_email`, `payout_method`, `onboarding_status`) · Tabla `booking_status_events` · Tabla `service_areas` · Cierre formal del documento en HU-017 |
| **1.2** | 2026-06-25 | **RFC-001 aprobado:** perfil del Tutor en `users` (`full_name`, `phone`, `avatar_url`, `location_id`) · nueva tabla `push_subscriptions` (11 → 12 tablas) · habilita HU-002 y el canal push de HU-009/012/014. Correcciones de consistencia: bucket `health-records` (no `health_records`), `day_of_week` 0=domingo, confirmación del bucket `avatars`, rótulo `lost_reports` (type='found') en Edge Function de matching, recuento de severidad de GAPs. |
| **1.3** | 2026-06-25 | **RFC-002 aprobado (GAP-004):** roles múltiples por usuario vía tabla `user_roles`; se retira `users.role`. **RFC-003 aprobado (GAP-005):** actor Admin operativo con HU-018 a HU-021 (acceso/permisos, panel y monitoreo, aprobación de Proveedores, moderación) + tabla inmutable `admin_audit_log`. El sistema pasa de 12 a **14 tablas** y de 17 a **21 HU**. |

---

## 7. Firmas de Aceptación

Al adoptar este documento, el equipo acepta que:

- El corpus normativo de §1 es la única fuente de verdad del sistema.
- Ninguna implementación puede contradecir los documentos bloqueados.
- Todo cambio pasa por el proceso RFC de §4 antes de ejecutarse.
- Los gaps de §5 son zonas de no-implementación hasta su resolución formal.

| Rol | Nombre | Fecha |
|---|---|---|
| Dev Lead | __________________ | Mayo 2025 |
| Dev | __________________ | Mayo 2025 |
| Dev | __________________ | Mayo 2025 |
| Comercial | __________________ | Mayo 2025 |

---

*Este documento debe actualizarse cada vez que se apruebe un RFC que modifique el corpus normativo. La versión vigente es siempre la que reside en `docs/SDD_LOCK.md` en la rama principal del repositorio.*
