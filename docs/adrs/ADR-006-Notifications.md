# ADR-006: Arquitectura de Notificaciones (Push y Email)
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado (con gaps pendientes de resolución — ver sección Consequences)

---

## Context

El sistema requiere notificaciones en dos contextos funcionalmente distintos con características diferentes:

**Contexto 1 — Alertas de Salud (HU-009):**
- Destinatario conocido: el Tutor propietario de la mascota.
- Disparador: fecha de vencimiento de vacuna o desparasitación.
- Timing: 30 días antes, 7 días antes y el día exacto del vencimiento.
- Canales: push (Web Push API) + email.
- Interactividad: el usuario puede hacer snooze de +7 días directamente desde la notificación (RN-007).
- Implementación especificada en el SDD: Supabase Edge Functions + cron job diario sobre `health_records`.

**Contexto 2 — Mascota Perdida (HU-012):**
- Destinatario: todos los usuarios de la plataforma dentro de un radio geoespacial de 5 KM de la ubicación de la mascota perdida (RN-012).
- Disparador: publicación de un nuevo reporte de pérdida.
- Canal: push (Web Push API) únicamente.
- Volumen: potencialmente alto y variable según densidad de usuarios en el radio.

**Contexto 3 — Motor de Coincidencias (HU-014):**
- Destinatario: Tutores con reportes de pérdida abiertos compatibles con la mascota encontrada.
- Disparador: registro de mascota encontrada en la vía pública.
- Canal: push (Web Push API).

El SDD especifica los proveedores: **Resend** para email y **Web Push API** para push. La implementación orquestadora es **Supabase Edge Functions**.

---

## Decision

Adoptar una arquitectura de notificaciones en dos capas:

**Capa de orquestación:** Supabase Edge Functions
- El cron job diario evalúa `health_records` y despacha alertas de HU-009.
- Las Edge Functions reactivas se disparan en eventos de `lost_reports` (nueva mascota perdida, nueva mascota encontrada) para HU-012 y HU-014.

**Capa de entrega:**

| Canal | Proveedor | Casos de uso |
|---|---|---|
| **Email** | Resend | Alertas de salud (HU-009), verificación de cuenta (HU-001) |
| **Push** | Web Push API (estándar W3C) | Alertas de salud (HU-009), mascota perdida (HU-012), motor de coincidencias (HU-014) |

**Flujo de alertas de salud (HU-009):**
```
Cron diario (Edge Function)
  → Consulta health_records WHERE next_due_date IN (hoy+30, hoy+7, hoy)
  → Para cada registro: envía push via Web Push API + email via Resend
  → El usuario puede hacer snooze: actualiza next_due_date += 7 días (RN-007)
```

**Flujo de notificación masiva por mascota perdida (HU-012):**
```
INSERT en lost_reports
  → Dispara Edge Function
  → ST_DWithin(lost_report.location, user.location, 5000)
  → Envía push a todos los usuarios en el radio
```

**Flujo de motor de coincidencias (HU-014):**
```
INSERT en lost_reports WHERE type = 'found'
  → Dispara Edge Function
  → ST_DWithin + filtro especie/raza/color contra reportes abiertos en 3 KM
  → Envía push a Tutores con búsquedas compatibles
```

---

## Consequences

**Positivas:**
- Resend y Web Push API son servicios que operan de forma independiente; un fallo en el canal email no afecta el canal push y viceversa.
- Web Push API es un estándar W3C sin dependencia de un proveedor de push externo (FCM, APNs), reduciendo integraciones.
- Supabase Edge Functions como orquestador centraliza la lógica de notificaciones sin exponer endpoints adicionales.

**Negativas / Restricciones:**
- **iOS Push:** Web Push en iOS solo funciona si el usuario agregó la PWA a su pantalla de inicio (A2HS). Los usuarios de iPhone que no realicen este paso no recibirán notificaciones push de HU-009 ni HU-012, degradando la propuesta de valor del pasaporte de salud.
- **Notificaciones masivas sin throttling:** La notificación de HU-012 a todos los usuarios en un radio de 5 KM no tiene política de rate limiting ni priorización documentada en el SDD. En zonas densas de Córdoba, un único reporte podría disparar miles de push simultáneos sobre la Edge Function. Ver GAP-011 en `docs/GAP_ANALYSIS.md`.
- **Usuarios sin permiso push:** El SDD no documenta el comportamiento cuando el usuario denegó el permiso de notificaciones push. Los registros de pérdida no llegarían por push; solo por email (si corresponde a HU-009). Para HU-012, no habría canal alternativo.
- **Panel de configuración de alertas (HU-009):** El SDD menciona un "panel de configuración de alertas por categorías" sin especificar qué categorías se pueden desactivar ni el estado por defecto (opt-in vs opt-out). El esquema de preferencias de usuario no puede diseñarse sin esta definición. Ver GAP-010.
- **Tokens push:** ~~La gestión (registro, renovación y baja) de tokens de dispositivos Web Push no está documentada en el SDD. Requiere una tabla de tokens en base de datos no especificada.~~ **Resuelto por RFC-001 (2026-06-25):** las suscripciones Web Push se almacenan en la tabla `push_subscriptions` (`endpoint`, `p256dh`, `auth`, `user_agent`), con relación 1:N por usuario. La baja de suscripciones expiradas se gestiona al detectar un endpoint caducado en el envío (ver `docs/system-architecture.md` §8.2). Ver `docs/rfcs/RFC-001-perfil-tutor-y-push-subscriptions.md`.

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Firebase Cloud Messaging (FCM)** | Requiere integración con Google como proveedor externo adicional. Web Push API cubre el caso de uso sin dependencia de FCM para navegadores. Para apps nativas FCM sería necesario, pero el SDD adopta PWA (ADR-005). |
| **OneSignal** | Servicio de terceros con modelo freemium. Agrega un proveedor externo adicional y dependencia en su plataforma para una funcionalidad central. Supabase Edge Functions + Web Push API directa elimina este intermediario. |
| **SendGrid (email)** | Alternativa válida a Resend. El SDD especifica Resend explícitamente en HU-009. |
| **Cron job propio en servidor** | Requiere infraestructura de servidor persistente propia. Supabase Edge Functions provee el cron job sin infraestructura adicional, consistente con la decisión de ADR-001. |
