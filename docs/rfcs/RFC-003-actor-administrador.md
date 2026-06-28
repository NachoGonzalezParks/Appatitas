# RFC-003: Actor Administrador — capacidades, pantallas y auditoría

**Autor:** Equipo APPATITAS
**Fecha:** 2026-06-25
**Estado:** Aprobado e incorporado al corpus (2026-06-25) — corpus en v1.3
**Nivel de aprobación requerido:** Todo el equipo (tipo "Nueva HU" + "Nueva tabla", SDD_LOCK §4.1)
**Resuelve:** GAP-005
**Depende de:** RFC-002 (el rol `admin` vive en `user_roles`)

---

## Motivación

GAP-005 (`docs/GAP_ANALYSIS.md`) señala que el Admin está listado en la Matriz de Actores (SDD §2.2) y es mencionado en HU-005 como responsable de aprobar Proveedores, pero **no tiene ninguna historia de usuario, pantalla, flujo ni permiso documentado**. Sin Admin operativo:

- Ningún Proveedor pasa de `pending_approval` a `active` → el marketplace (HU-016/017) no tiene oferta.
- No hay forma de moderar reportes de mascotas perdidas (fotos ofensivas, spam).
- No hay forma de monitorear las transacciones del marketplace.

Esta decisión **incorpora al Admin como actor de primera clase** con capacidades, pantallas, flujos, permisos, panel de control y monitoreo de transacciones, y agrega un **log de auditoría inmutable** de sus acciones.

---

## Decisión

### A. El Admin existe como rol controlado

El rol `admin` se asigna exclusivamente en `user_roles` (RFC-002), nunca por autoservicio. Se concede manualmente por otro Admin o por el Dev Lead.

### B. Nuevas Historias de Usuario (HU-018 a HU-021)

Se agregan al SDD_MASTER cuatro HU del actor Admin:

| HU | Título | Fase | Capacidad |
|---|---|---|---|
| **HU-018** | Acceso y Permisos de Administrador | 1 | Autenticación con rol `admin`, área `/admin` protegida, permisos por capacidad |
| **HU-019** | Panel de Control y Monitoreo de Transacciones | 1 (base) / 2 (transacciones) | Dashboard con métricas de la plataforma y monitoreo de reservas/pagos |
| **HU-020** | Aprobación y Gestión de Proveedores | 1 | Aprobar/rechazar Proveedores (`pending_approval` ↔ `active`), otorgar sello "Verificado" |
| **HU-021** | Moderación de Reportes de la Comunidad | 1 | Ocultar/eliminar reportes de `lost_reports` con contenido inadecuado |

Los criterios de aceptación completos se redactan en `docs/SDD_MASTER.md` §6 (Módulo de Administración).

### C. Nueva tabla `admin_audit_log` (inmutable)

Toda acción sensible del Admin se registra de forma inmutable, en coherencia con la filosofía de `booking_status_events`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `admin_id` | `uuid` | NOT NULL, FK → `users.id` (el Admin que ejecuta) |
| `action` | `text` | NOT NULL (ej: `provider_approved`, `provider_rejected`, `report_hidden`, `verified_badge_granted`) |
| `target_table` | `text` | NOT NULL (ej: `providers`, `lost_reports`) |
| `target_id` | `uuid` | NOT NULL (id de la entidad afectada) |
| `metadata` | `jsonb` | NULLABLE (motivo, valores previos, contexto) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

- **Inmutable:** solo INSERT. Sin UPDATE ni DELETE (RLS).
- Cada capacidad de HU-020/HU-021 escribe una fila aquí.

### D. Permisos del Admin (qué puede hacer)

| Capacidad | Entidad afectada | HU | Audita |
|---|---|---|---|
| Aprobar/rechazar Proveedor | `providers.status`, `onboarding_status` | HU-020 | Sí |
| Otorgar/revocar sello "Verificado" | `providers.verified` | HU-020 | Sí |
| Ocultar/eliminar reporte | `lost_reports.status` / flag de moderación | HU-021 | Sí |
| Ver dashboard y transacciones | lectura de `bookings`, `booking_status_events`, agregados | HU-019 | No (solo lectura) |
| Asignar rol `admin` a otro usuario | `user_roles` | HU-018 | Sí |

> **Nota de moderación (HU-021):** para "ocultar" un reporte sin borrarlo físicamente, se reutiliza el ciclo de estados de `lost_reports`. Si el equipo necesita un estado explícito de moderación (`hidden`/`removed`), se amplía el CHECK de `lost_reports.status` por RFC menor; por ahora la moderación marca el reporte como `closed` con registro en `admin_audit_log`.

---

## HU afectadas

- **Nuevas:** HU-018, HU-019, HU-020, HU-021.
- **HU-005** — la aprobación del Proveedor queda formalizada en HU-020 (deja de ser un gap).
- **HU-016** — el sello "Verificado" lo otorga el Admin (HU-020).
- **HU-012/013/014/015** — sujetas a moderación por HU-021.

---

## Documentos a actualizar

- `docs/SDD_MASTER.md` — nuevo §6 "Módulo de Administración" (HU-018 a HU-021), actualización del cierre.
- `docs/architecture/database.md` — nueva tabla `admin_audit_log`, permisos del Admin.
- `docs/architecture/security.md` — matriz de permisos del Admin, RLS de `admin_audit_log` y de capacidades.
- `docs/SDD_LOCK.md` — §2.1 (HU-018..021), §2.2 (conteo de tablas → 14), historial.
- `docs/domain-map.md` — actor Admin elaborado, módulo de Administración, entidad `AdminAuditLog`.
- `docs/system-architecture.md` — matriz de acceso `/admin`, `erDiagram`.
- `docs/traceability.md` — HU-018 a HU-021.
- `docs/technical-backlog.md` — tareas de Admin y su ubicación en el cronograma.

---

## Tablas afectadas

- `admin_audit_log` (nueva).
- `providers`, `lost_reports`, `user_roles` (escritura por capacidades del Admin; sin cambio de esquema salvo posible flag de moderación futuro).
- Total del sistema con RFC-001 + RFC-002 + RFC-003: **14 tablas**.

---

## Reglas de negocio afectadas

- Formaliza RN-002/RN-025 (aprobación de Proveedores) asignándoles un actor responsable: el Admin (HU-020).
- Formaliza RN-021 (sello "Verificado") como acción del Admin.
- Nueva regla derivada: *"Toda acción del Admin que modifique datos de Proveedores o reportes debe registrarse en `admin_audit_log`."*

---

## Riesgos

- **Escalada de privilegios.** El rol `admin` da acceso amplio. Mitigación: asignación solo manual (RFC-002), RLS estricta, y auditoría inmutable en `admin_audit_log`.
- **Alcance del panel.** El dashboard de HU-019 puede crecer indefinidamente. Mitigación: en Fase 1 cubre aprobación de Proveedores y moderación; el monitoreo de transacciones se habilita con Fase 2 (cuando existan `bookings` reales).
- **Sin gestión de disputas.** Este RFC no define un flujo de disputas de pago (sigue ligado a GAP-003). Se documenta como fuera de alcance.

---

## ADR requerido

No se requiere ADR nuevo. Se referencia en **ADR-002 (Auth y RLS)** la matriz de permisos del Admin, la RLS de `admin_audit_log` (solo INSERT) y el uso de `has_role(auth.uid(), 'admin')` (RFC-002) como guarda del área `/admin`.
