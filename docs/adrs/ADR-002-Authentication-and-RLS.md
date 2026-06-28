# ADR-002: Autenticación con Supabase Auth y Row Level Security
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado (política de RLS pendiente de especificación — ver GAP-014)

---

## Context

El sistema maneja datos sensibles de múltiples actores con distintos niveles de acceso:

- **Tutores** registran mascotas, registros de salud, historial clínico y datos de contacto. Sus datos no deben ser accesibles por otros Tutores (HU-002 a HU-011).
- **Proveedores** cargan datos comerciales, CUIT/DNI, billing_email y payout_method (HU-005, HU-006). Estos datos son privados.
- **Administradores** deben poder acceder a datos de Proveedores para aprobar o rechazar solicitudes (HU-005).
- **Visitantes sin sesión** acceden a rutas públicas específicas: mapa de mascotas perdidas (HU-013), formulario de mascota encontrada (HU-014) y enlace de pasaporte compartido (HU-011).

El SDD define tres roles: `tutor`, `provider`, `admin` en la tabla `users`. La plataforma base (Supabase) ofrece dos mecanismos complementarios para implementar esta autorización: JWT con claims personalizados y Row Level Security (RLS) a nivel de PostgreSQL.

---

## Decision

**Autenticación:** Delegar completamente en **Supabase Auth**, que provee:
- Email/contraseña con verificación de email obligatoria (RN-004).
- OAuth 2.0 con Google y Facebook (HU-001).
- Generación y validación de JWT para todas las solicitudes autenticadas.

**Autorización:** Implementar **Row Level Security (RLS)** en PostgreSQL para controlar el acceso a datos por fila, usando el `user_id` del JWT de Supabase como identificador del actor en cada política.

**Roles (RFC-002):** los roles del usuario viven en la tabla `user_roles` (no en un campo escalar `users.role`), permitiendo roles múltiples (`tutor` + `provider`). La autorización por rol se evalúa con una función `has_role(uid uuid, r text)` marcada `STABLE`:

```sql
CREATE FUNCTION has_role(uid uuid, r text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND role = r);
$$;
```

Las políticas usan `has_role(auth.uid(), 'admin')`, `has_role(auth.uid(), 'provider')`, etc. El rol `admin` solo se asigna manualmente (RFC-003), nunca por autoservicio.

**Área de administración (RFC-003):** el área `/admin` (HU-018..021) queda protegida por `has_role(auth.uid(), 'admin')`. La tabla `admin_audit_log` registra de forma **inmutable** las acciones del Admin: política de **solo INSERT** (sin UPDATE ni DELETE), con lectura restringida a `admin`.

**Rutas públicas documentadas en el SDD:**

| Ruta | HU | Mecanismo |
|---|---|---|
| `/passport/{hash}` | HU-011 | Token hash con expiración, sin sesión requerida |
| Mapa comunitario | HU-013 | Acceso anónimo a `lost_reports` con `status = 'lost'` |
| Reporte mascota encontrada | HU-014 | Formulario público, sin autenticación |

**Verificación de email:** El acceso completo queda bloqueado hasta que Supabase Auth confirme la verificación (RN-004). La restricción se aplica a nivel de la sesión devuelta por Supabase Auth.

---

## Consequences

**Positivas:**
- RLS enforced a nivel de base de datos: las políticas aplican incluso si la lógica de aplicación tiene un error, dado que PostgreSQL las valida en cada query.
- El JWT de Supabase Auth incluye el `user_id` y puede incluir el `role` como claim, disponible directamente en las políticas RLS sin consultas adicionales.
- Rutas públicas (HU-011, HU-013, HU-014) no requieren lógica de autenticación especial; se gestionan con el rol anónimo de Supabase.

**Negativas / Restricciones:**
- Las políticas de RLS deben diseñarse y mantenerse por tabla. Un error en una política puede exponer o bloquear datos de forma inesperada.
- La política de RLS concreta para cada tabla **no está especificada en el SDD v1.1**. Debe definirse antes de la implementación (GAP-014 en `docs/GAP_ANALYSIS.md`).
- El enlace de pasaporte (HU-011) expone datos de salud de la mascota sin sesión. La seguridad depende de la entropía del hash y del TTL de 7 días (RN-008). No hay mecanismo de revocación anticipada documentado en el SDD.
- **`push_subscriptions` (RFC-001):** la tabla de suscripciones Web Push guarda datos por usuario y requiere política RLS — cada usuario solo puede leer, insertar y eliminar sus propias suscripciones (`user_id = auth.uid()`). Las Edge Functions de notificación (HU-009/012/014) leen esta tabla con el `service_role`, fuera del alcance de RLS. Se coordina con GAP-014. Ver `docs/rfcs/RFC-001-perfil-tutor-y-push-subscriptions.md`.

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Auth0** | Servicio externo adicional. Supabase Auth ya cubre OAuth 2.0 y email/contraseña nativamente, sin necesidad de un proveedor separado. |
| **JWT propio sin RLS (solo validación en capa de aplicación)** | La autorización en capa de aplicación es susceptible a errores lógicos que exponen datos. RLS a nivel de base de datos es más robusto para datos sensibles como historial clínico y datos financieros de Proveedores. |
| **ACL por tabla en capa de aplicación** | Requiere mantener listas de control de acceso en código. RLS centraliza esta lógica en la base de datos, evitando duplicación. |
