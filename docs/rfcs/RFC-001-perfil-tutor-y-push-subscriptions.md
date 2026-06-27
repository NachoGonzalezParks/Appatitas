# RFC-001: Almacenamiento de perfil del Tutor y suscripciones push

**Autor:** Alejandro González (aegonzalez73)
**Fecha:** 2026-06-23
**Versión:** 2 (2026-06-27)
**Estado:** Propuesto v2 — pendiente de aprobación del equipo
**Nivel de aprobación requerido:** Dev Lead + revisión de equipo (tipo "Nueva tabla o columna", SDD_LOCK §4.1)

> **Cambios v1 → v2:** Se deja **firme la tabla `push_subscriptions`** como única
> forma de almacenar las suscripciones Web Push y se **descarta explícitamente** el
> enfoque provisional `users.push_token` (columna única) que aparece en
> `docs/sprint-2-plan.md` y `docs/dev-guide.md`. Se agregan el DDL completo de la
> tabla y sus políticas RLS. La parte A (perfil del Tutor) ya fue incorporada en los
> planes de sprint (`users.location_id`, `full_name`, `avatar_url`, `phone`) y se
> mantiene aquí sólo como registro.

---

## Motivación

Al validar el esquema bloqueado (11 tablas, SDD_LOCK §2.2) contra las historias de
usuario de Fase 1, se detectaron **dos campos de datos sin lugar donde almacenarse**.
Ambos bloquean historias de Fase 1 y ninguno estaba registrado como GAP:

1. **Perfil del Tutor.** HU-002 exige guardar del Tutor su **nombre completo,
   teléfono, avatar y ubicación**. La tabla `users` sólo tiene
   `id, email, role, email_verified, created_at, updated_at`
   (`docs/architecture/database.md` §3.1) y **no existe una tabla `tutors`**.
   Además, la búsqueda HU-016 usa `tutor.location`
   (`docs/architecture/database.md` §5), pero no hay forma de vincular un Tutor
   con una fila de `locations`.

2. **Suscripciones Web Push.** Los flujos de notificaciones consultan
   `users.push_token` (`docs/system-architecture.md` §6.2 y §6.3), pero esa columna
   no existe y no hay tabla de suscripciones push. HU-009, HU-012 y HU-014 dependen
   de Web Push y hoy no tienen dónde guardar la suscripción del navegador.

---

## Cambio propuesto

Cambios **aditivos y mínimos** (todo lo nuevo en `users` es NULLABLE para no romper
inserts existentes).

### A. Perfil del Tutor — columnas en `users` *(ya incorporado en los planes)*

| Columna | Tipo | Restricciones |
|---|---|---|
| `full_name` | `text` | NULLABLE |
| `phone` | `text` | NULLABLE |
| `avatar_url` | `text` | NULLABLE |
| `location_id` | `uuid` | NULLABLE, FK → `locations.id` |

> Se eligió **enriquecer `users`** en lugar de crear una tabla `tutors`, para no
> introducir una entidad ni un Bounded Context nuevos. Es coherente con `providers`,
> que también tiene `location_id`.

### B. Suscripciones push — tabla `push_subscriptions` (DECISIÓN FIRME)

Esta es la parte que este RFC v2 deja cerrada. La suscripción Web Push **no es un
token**: es un objeto con un `endpoint` y dos claves (`p256dh`, `auth`), y un mismo
usuario puede tener **varios dispositivos**. Por eso se modela como tabla 1:N y no
como columna.

```sql
-- supabase/migrations/00XX_create_push_subscriptions.sql
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- RLS: cada usuario gestiona sólo sus propias suscripciones.
-- El cron de alertas corre con service_role y omite RLS para leer todas.
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
```

### Por qué NO `users.push_token` (enfoque a descartar)

| Criterio | `users.push_token` (columna única) | `push_subscriptions` (tabla) |
|---|---|---|
| Estructura de la suscripción | Obliga a serializar endpoint + claves en un texto | Campos tipados (`endpoint`, `p256dh`, `auth`) |
| Multidispositivo | ❌ Sólo 1 dispositivo: cada `subscribe()` pisa al anterior | ✅ N dispositivos por usuario |
| Limpieza de tokens vencidos | Difícil (un único valor) | ✅ `DELETE` de la fila por `endpoint` |
| Compatibilidad con Web Push API | Requiere parsear el blob en cada envío | ✅ Uso directo de los campos |

**Acción concreta:** no crear la migración `0014_add_push_token_to_users.sql` ni la
columna `users.push_token`. El registro de suscripciones en la PWA hace `INSERT` en
`push_subscriptions`; el cron `health-alerts-cron` y `lost-pet-notify` hacen `JOIN`
contra esa tabla para obtener los endpoints de destino.

---

## HU afectadas

- **HU-002** (Completar Perfil de Tutor) — habilitada por el cambio A.
- **HU-016** (Búsqueda por proximidad) — el origen `tutor.location` queda definido (cambio A).
- **HU-009 / HU-012 / HU-014** (alertas y avisos push) — habilitadas por el cambio B.

---

## Documentos a actualizar

- `docs/architecture/database.md` — columnas de `users` (§3.1), nueva tabla
  `push_subscriptions` (§3.x), consultas (§5).
- `docs/SDD_LOCK.md` §2.2 — pasa de 11 a **12 tablas**.
- `docs/domain-map.md` §5 — relación User→Location respaldada por el esquema.
- `docs/traceability.md` — HU-002, HU-009, HU-012, HU-014.
- `docs/sprint-2-plan.md` — reemplazar `0014_add_push_token_to_users.sql` y toda
  referencia a `users.push_token` por `push_subscriptions`.
- `docs/dev-guide.md` — actualizar la migración de ejemplo `0014_push_token.sql` y la
  dependencia "Migración `push_token` en `users`" (Sprint 2, Día 1).
- `docs/system-architecture.md` — `erDiagram` y reemplazo de `users.push_token`
  por `push_subscriptions` en §6.2 y §6.3.

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

- **Tocar el corpus bloqueado.** Mitigación: cambios aditivos; las columnas de
  `users` son NULLABLE y la tabla es nueva.
- **RLS de `push_subscriptions`.** Resuelta en este RFC (políticas por `user_id`).
  El cron usa `service_role`, que omite RLS para leer todas las suscripciones.
- **Endpoint rotado por el navegador.** `endpoint` es UNIQUE; al re-suscribir se
  inserta una fila nueva y se eliminan las que devuelvan 404/410 al enviar push
  (ver árbol de decisión en `docs/system-architecture.md` §8.2).
- **Coordinación con los planes ya mergeados.** Sprint 2 y dev-guide referencian
  `users.push_token`; deben actualizarse junto con este RFC para evitar que dev1
  cree la columna por error.

---

## ADR requerido

No se requiere ADR nuevo. Se referencia en **ADR-006 (Notificaciones)** la tabla
`push_subscriptions` como almacén de suscripciones, y en **ADR-002 (Auth y RLS)**
sus políticas RLS.
