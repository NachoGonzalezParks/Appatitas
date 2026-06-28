# RFC-001: Almacenamiento de perfil del Tutor y suscripciones push

**Autor:** Alejandro González (aegonzalez73)
**Fecha:** 2026-06-23
**Estado:** Aprobado e incorporado al corpus (2026-06-25) — corpus en v1.2
**Nivel de aprobación requerido:** Dev Lead + revisión de equipo (tipo "Nueva tabla o columna", SDD_LOCK §4.1)

> **Aplicado el 2026-06-25.** Los cambios A y B fueron incorporados al corpus normativo: `docs/architecture/database.md` (§3.1, §3.12, §4, §5), `docs/SDD_LOCK.md` (§1, §2.2 — 12 tablas, historial v1.2), `docs/system-architecture.md` (erDiagram, flujos push, buckets), `docs/traceability.md`, `docs/domain-map.md`, `docs/sprint-0-plan.md` y `docs/technical-backlog.md`. Migraciones de Sprint 0 ajustadas: `0002_create_users.sql` incluye las 4 columnas de perfil y se agrega `0013_create_push_subscriptions.sql`.

---

## Motivación

Al validar el esquema bloqueado (11 tablas, SDD_LOCK §2.2) contra las historias de
usuario de Fase 1, se detectaron **dos campos de datos sin lugar donde almacenarse**.
Ambos bloquean historias de Fase 1 y ninguno está registrado como GAP:

1. **Perfil del Tutor.** HU-002 exige guardar del Tutor su **nombre completo,
   teléfono, avatar y ubicación**. La tabla `users` sólo tiene
   `id, email, role, email_verified, created_at, updated_at`
   (`docs/architecture/database.md` §3.1) y **no existe una tabla `tutors`**.
   Además, la búsqueda HU-016 usa `tutor.location`
   (`docs/architecture/database.md` §5), pero no hay forma de vincular un Tutor
   con una fila de `locations`. El `domain-map` §5 afirma la relación
   `User (Tutor) ──(1:1)──► Location`, pero el esquema real no la implementa.

2. **Suscripciones Web Push.** Los flujos de notificaciones consultan
   `users.push_token` (`docs/system-architecture.md` §6.2 y §6.3), pero esa columna
   no existe y no hay tabla de suscripciones push. HU-009, HU-012 y HU-014 dependen
   de Web Push y hoy no tienen dónde guardar el endpoint del navegador.

Sin estos cambios, HU-002 (Sprint 1) y el canal push de HU-009/012/014 no son
implementables dentro del esquema bloqueado.

---

## Cambio propuesto

Cambios **aditivos y mínimos** (todo nuevo es NULLABLE para no romper inserts existentes).

### A. Perfil del Tutor — agregar columnas a `users`

| Columna | Tipo | Restricciones |
|---|---|---|
| `full_name` | `text` | NULLABLE |
| `phone` | `text` | NULLABLE |
| `avatar_url` | `text` | NULLABLE |
| `location_id` | `uuid` | NULLABLE, FK → `locations.id` |

> Se eligió **enriquecer `users`** en lugar de crear una tabla `tutors` para no
> introducir una entidad nueva ni un Bounded Context nuevo. Es coherente con el
> patrón ya usado en `providers` (que también tiene `location_id`).

### B. Suscripciones push — nueva tabla `push_subscriptions`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` |
| `endpoint` | `text` | NOT NULL, UNIQUE |
| `p256dh` | `text` | NOT NULL |
| `auth` | `text` | NOT NULL |
| `user_agent` | `text` | NULLABLE |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

> Un usuario puede tener varios dispositivos → relación 1:N. Se guarda el objeto
> de suscripción completo (endpoint + claves), no un "token" suelto, como exige la
> Web Push API. Reemplaza la referencia a `users.push_token` de los diagramas.

### Impacto en migraciones (Sprint 0)

Como el esquema **todavía no está implementado**, lo más simple es **corregir las
migraciones de Sprint 0 antes de ejecutarlas**, sin migraciones de alteración:

- Modificar `0002_create_users.sql` para incluir las 4 columnas de perfil.
- Agregar `0013_create_push_subscriptions.sql`.

Si el esquema ya estuviera aplicado, se haría con un `ALTER TABLE` y una migración nueva.

---

## HU afectadas

- **HU-002** (Completar Perfil de Tutor) — habilitada por el cambio A.
- **HU-016** (Búsqueda por proximidad) — el origen `tutor.location` queda definido (cambio A).
- **HU-009 / HU-012 / HU-014** (alertas y avisos push) — habilitadas por el cambio B.

---

## Documentos a actualizar

- `docs/architecture/database.md` — columnas de `users` (§3.1), nueva tabla
  `push_subscriptions`, consultas geoespaciales (§5).
- `docs/SDD_LOCK.md` §2.2 — pasa de 11 a **12 tablas**.
- `docs/domain-map.md` §5 — la relación User→Location queda respaldada por el esquema.
- `docs/traceability.md` — HU-002, HU-009, HU-012, HU-014.
- `docs/sprint-0-plan.md` — lista de migraciones y conteo de tablas.
- `docs/system-architecture.md` — `erDiagram` y reemplazo de `users.push_token`
  por `push_subscriptions`.

---

## Tablas afectadas

- `users` (modificada — 4 columnas nuevas).
- `push_subscriptions` (nueva). Total del sistema: **12 tablas**.

---

## Reglas de negocio afectadas

Ninguna RN nueva. Las RN-006/012/014 ya describen el canal push; este RFC sólo
provee el almacenamiento que les faltaba.

---

## Riesgos

- **Tocar el corpus bloqueado.** Mitigación: cambios puramente aditivos y NULLABLE;
  no alteran columnas existentes ni rompen las demás migraciones.
- **RLS de `push_subscriptions`.** La tabla guarda datos por usuario → necesita
  política RLS (cada usuario sólo ve/gestiona sus suscripciones). Se coordina con GAP-014.
- **`endpoint` único.** Evita duplicar suscripciones del mismo navegador; si el
  navegador rota el endpoint, se inserta uno nuevo y se limpian los expirados
  (ver árbol de decisión de push en `docs/system-architecture.md` §8.2).

---

## ADR requerido

No se requiere ADR nuevo. Se referencia en **ADR-006 (Notificaciones)** la tabla
`push_subscriptions` como almacén de suscripciones, y en **ADR-002 (Auth y RLS)**
la política de la nueva tabla.
