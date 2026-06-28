# RFC-002: Roles múltiples por usuario

**Autor:** Equipo APPATITAS
**Fecha:** 2026-06-25
**Estado:** Aprobado e incorporado al corpus (2026-06-25) — corpus en v1.3
**Nivel de aprobación requerido:** Todo el equipo (tipo "Nueva tabla o columna" + cambio en flujo de autenticación, SDD_LOCK §4.1)
**Resuelve:** GAP-004

---

## Motivación

GAP-004 (`docs/GAP_ANALYSIS.md`) señala que el SDD modela un único `role` escalar por usuario (`users.role`), pero el dominio requiere que **una misma persona pueda tener varios roles** simultáneamente. Casos reales:

- Un Proveedor que también es Tutor y quiere registrar la salud de su propia mascota.
- Un miembro del equipo (Admin) que además usa la app como Tutor.

El flujo de onboarding de HU-001/HU-005 ("Soy dueño" / "Ofrezco servicios") sugería exclusividad, lo cual queda **descartado por esta decisión**: un usuario puede acumular roles.

---

## Decisión

Un usuario puede tener **uno o más roles** del conjunto `{tutor, provider, admin}`.

Se modela mediante una **tabla de unión `user_roles`** (relación 1:N), en lugar del campo escalar `users.role`. La tabla `user_roles` pasa a ser la fuente autoritativa del conjunto de roles de cada usuario.

### Cambio de esquema

**A. Nueva tabla `user_roles`**

| Columna | Tipo | Restricciones |
|---|---|---|
| `user_id` | `uuid` | NOT NULL, FK → `users.id`, parte de PK |
| `role` | `text` | NOT NULL, CHECK IN ('tutor','provider','admin'), parte de PK |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

- **PRIMARY KEY (`user_id`, `role`)** — evita roles duplicados por usuario.
- Un usuario sin filas en `user_roles` no tiene rol asignado (no debería ocurrir tras el registro).

**B. Deprecación de `users.role`**

La columna escalar `users.role` se **retira**. El conjunto de roles vive exclusivamente en `user_roles`. El trigger de Auth, que antes insertaba `users.role`, ahora inserta una fila en `user_roles` con el rol elegido en el onboarding.

### Asignación de roles

- **`tutor`** y **`provider`**: autoservicio. El usuario los adquiere al completar el flujo de registro correspondiente (HU-001 / HU-005). Un Tutor existente puede sumar el rol `provider` completando HU-005 sin crear una cuenta nueva, y viceversa.
- **`admin`**: **nunca** autoservicio. Solo se asigna manualmente por otro Admin o por el Dev Lead vía operación controlada (ver RFC-003).

### Impacto en RLS

Las políticas que dependían de `users.role` pasan a consultar `user_roles`. Se define una función `has_role(uid uuid, r text)`:

```sql
-- Devuelve true si el usuario uid tiene el rol r
SELECT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = uid AND role = r
);
```

Las políticas usan `has_role(auth.uid(), 'admin')`, `has_role(auth.uid(), 'provider')`, etc. Ver ADR-002.

### Impacto en migraciones (Sprint 0)

Como el esquema todavía no está implementado, se corrige antes de ejecutar:

- Modificar `0002_create_users.sql`: **eliminar** la columna `role` y su CHECK.
- Agregar `0014_create_user_roles.sql`.
- El trigger Auth → `public.users` inserta además en `user_roles`.

---

## HU afectadas

- **HU-001** (Registro de Tutor) — crea fila en `user_roles` con `role='tutor'` en vez de `users.role`.
- **HU-005** (Registro de Proveedor) — agrega `role='provider'`; si el usuario ya era Tutor, **suma** el rol sin reemplazar.
- **HU-018 a HU-021** (Admin, RFC-003) — el rol `admin` se gestiona en `user_roles`.
- Toda HU con RLS basada en rol.

---

## Documentos a actualizar

- `docs/SDD_MASTER.md` — §2.2 (nota de roles múltiples), HU-001 y HU-005 (criterios).
- `docs/architecture/database.md` — `users` (retiro de `role`), nueva tabla `user_roles`, §5/§6.
- `docs/architecture/security.md` — matriz de roles, RLS por rol vía `has_role()`.
- `docs/SDD_LOCK.md` — §2.2 (conteo de tablas), historial.
- `docs/domain-map.md` — entidad `UserRole`, relación User→roles.
- `docs/system-architecture.md` — `erDiagram`, flujo de Auth, matriz de acceso.
- `docs/traceability.md` — HU-001, HU-005.
- `docs/technical-backlog.md` y `docs/sprint-0-plan.md` — migraciones y conteo.

---

## Tablas afectadas

- `users` (modificada — retiro de `role`).
- `user_roles` (nueva).
- Junto con RFC-001 (`push_subscriptions`) y RFC-003 (`admin_audit_log`), el sistema llega a **14 tablas**.

---

## Reglas de negocio afectadas

Sin RN nuevas obligatorias. Se documenta como aclaración de negocio: *"Un usuario puede acumular los roles `tutor` y `provider`; el rol `admin` solo se asigna internamente."* (Ver RN derivada en `business-rules.md` si el equipo decide formalizarla.)

---

## Riesgos

- **Tocar el flujo de Auth.** Mitigación: el trigger se ajusta una sola vez en Sprint 0, antes de existir datos.
- **RLS más costosa.** Cada chequeo de rol implica una consulta a `user_roles`. Mitigación: índice por `user_id` (implícito en la PK compuesta) y función `has_role` con `STABLE`.
- **UI de rol activo.** Un usuario con varios roles necesita un selector de "rol activo" en la interfaz. Es una decisión de UX a resolver en Sprint 1 (no bloquea el esquema).

---

## ADR requerido

No se requiere ADR nuevo. Se referencia en **ADR-002 (Auth y RLS)** la tabla `user_roles` y la función `has_role()` como base de la autorización por rol.
