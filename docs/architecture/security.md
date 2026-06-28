# Arquitectura de Seguridad — APPATITAS
**Versión:** 1.1
**Fuente:** `docs/SDD_MASTER.md` v1.2 · `docs/rfcs/RFC-001..003`
**Fecha:** Mayo 2025 · Revisión: 2026-06-25 (RFC-002/003)

Este documento describe exclusivamente los elementos de seguridad declarados o implicados directamente por el SDD_MASTER. No se documentan controles que no tengan base en dicho documento.

---

## 1. Autenticación

### 1.1 Métodos soportados
Definidos en HU-001:

| Método | Proveedor | HU |
|---|---|---|
| Email + contraseña | Supabase Auth | HU-001 |
| OAuth 2.0 — Google | Supabase Auth | HU-001 |
| OAuth 2.0 — Facebook | Supabase Auth | HU-001 |

### 1.2 Verificación de email
- **Requerida:** El acceso completo a la plataforma está bloqueado hasta que el usuario verifique su correo electrónico (RN-004, HU-001).
- **Mecanismo:** Supabase Auth envía el correo de verificación. El acceso se habilita al hacer clic en el enlace.

### 1.3 Unicidad de identidad
- El email debe ser único en el sistema (RN-005). Supabase Auth enforces esta restricción a nivel de proveedor de identidad.

---

## 2. Autorización

### 2.1 Roles del sistema
Definidos en la tabla `user_roles` (RFC-002, resuelve GAP-004). Un usuario puede acumular varios roles; la columna escalar `users.role` quedó retirada.

| Rol | Descripción | Acceso | Asignación |
|---|---|---|---|
| `tutor` | Dueño de mascota. Consume servicios. | Gratuito | Autoservicio (HU-001) |
| `provider` | Proveedor de servicios. Genera revenue. | Requiere aprobación Admin (RN-002, HU-020) | Autoservicio (HU-005) |
| `admin` | Equipo interno. Opera y modera la plataforma. | Interno | **Solo manual** (RFC-003, HU-018) — nunca autoservicio |

**Roles múltiples (RFC-002):** una cuenta puede tener `tutor` + `provider` simultáneamente. La autorización por rol en RLS se evalúa con la función `has_role(auth.uid(), '<rol>')`, que consulta `user_roles`.

### 2.1.1 Permisos del Administrador (RFC-003)

El Admin opera el área `/admin`, protegida por `has_role(auth.uid(), 'admin')`. Capacidades y auditoría:

| Capacidad | Entidad | HU | Registra en `admin_audit_log` |
|---|---|---|---|
| Aprobar / rechazar Proveedor | `providers.status`, `onboarding_status` | HU-020 | Sí |
| Otorgar / revocar sello "Verificado" | `providers.verified` | HU-020 | Sí |
| Ocultar / cerrar reporte por moderación | `lost_reports.status` | HU-021 | Sí |
| Asignar rol `admin` a otro usuario | `user_roles` | HU-018 | Sí |
| Ver dashboard y transacciones (solo lectura) | `bookings`, `booking_status_events`, agregados | HU-019 | No |

La tabla `admin_audit_log` es **inmutable** (solo INSERT). Ver ADR-002 y `database.md` §3.14.

### 2.2 Control de visibilidad de Proveedores
- Un Proveedor con `status = 'pending_approval'` **no aparece** en ningún módulo de búsqueda ni es accesible por Tutores (RN-002, HU-005).
- Solo los Proveedores con `status = 'active'` son visibles en la plataforma.

### 2.3 Accesos públicos documentados
Las siguientes rutas son accesibles sin autenticación según el SDD:

| Ruta | HU | Restricción |
|---|---|---|
| `/passport/{hash}` | HU-011 | Solo lectura. Expira en 7 días (RN-008) |
| Mapa comunitario de alertas | HU-013 | Solo lectura. Sin sesión requerida (RN-015) |
| Reporte de mascota encontrada | HU-014 | Formulario público (ciudadano sin cuenta) |

### 2.4 Row Level Security (RLS)
El SDD referencia Supabase como plataforma de base de datos. Supabase requiere RLS para proteger datos entre usuarios. La política RLS detallada por tabla sigue pendiente (GAP-014), pero tras RFC-002/003 quedan fijadas estas bases:

- La autorización por rol usa `has_role(auth.uid(), '<rol>')` sobre `user_roles` (RFC-002), no un claim escalar.
- `user_roles`: cada usuario lee sus propios roles; la **asignación** del rol `admin` solo la puede hacer otro Admin (`has_role(auth.uid(),'admin')`).
- `push_subscriptions` (RFC-001): cada usuario gestiona solo sus suscripciones (`user_id = auth.uid()`).
- `admin_audit_log` (RFC-003): **solo INSERT**; lectura restringida a `admin`. Sin UPDATE ni DELETE para nadie.

Ver GAP-014 en `docs/GAP_ANALYSIS.md` y ADR-002.

---

## 3. Datos Sensibles

### 3.1 Datos identificados como sensibles en el SDD

| Dato | Entidad | HU | Observaciones |
|---|---|---|---|
| CUIT / DNI | `providers` | HU-005 | "Para validación diferida". No se describe cifrado ni política de retención. |
| Teléfono de contacto | `users`, `lost_reports` | HU-002, HU-012 | Visible en reporte público de mascota perdida. |
| Registros de salud de mascota | `health_records` | HU-007 a HU-010 | Datos médicos. Acceso restringido al Tutor propietario. |
| Adjuntos clínicos | Supabase Storage | HU-010 | PDFs e imágenes médicas. |
| `billing_email`, `payout_method` | `providers` | HU-005 (v1.1) | Datos financieros del Proveedor. |
| Recompensa en ARS | `lost_reports` | HU-012 | Informativa. Sin gestión financiera documentada. |

### 3.2 Pasaporte compartido
- El enlace `/passport/{hash}` expone datos de salud de la mascota sin requerir login (RN-009).
- Mitigaciones documentadas en el SDD: hash seguro como identificador, expiración máxima de 7 días (RN-008).
- El SDD no documenta mecanismos adicionales (revocación anticipada de enlace, watermarking, logging de accesos).

---

## 4. Seguridad en Pagos

### 4.1 Mercado Pago Marketplace
El modelo de pagos (Fase 2, §2.1) delega la seguridad transaccional a Mercado Pago Marketplace:

- Appatitas **no almacena** datos de tarjetas de crédito/débito. El procesamiento es íntegramente gestionado por Mercado Pago.
- La comisión es retenida por Mercado Pago en nombre de Appatitas hasta la verificación del servicio (RN-001).
- El payout al Proveedor se libera una vez verificado el servicio realizado.

**Campos relacionados en `providers` (v1.1):**
- `payout_method`: método de cobro del Proveedor.
- `billing_email`: email de facturación.
- `onboarding_status`: estado del proceso de alta en Mercado Pago.

### 4.2 Validación de CUIT/DNI
- El CUIT/DNI del Proveedor (HU-005) es capturado para "validación diferida por Admin". El SDD no documenta el mecanismo técnico de validación.

---

## 5. Seguridad en Notificaciones

### 5.1 Notificaciones push masivas (HU-012)
- Las notificaciones push se envían vía **Web Push API** a usuarios en radio de 5 KM al reportar una mascota perdida (RN-012).
- El SDD no documenta política de opt-in/opt-out de notificaciones push ni manejo de tokens de dispositivos.
- Ver GAP-011 en `docs/GAP_ANALYSIS.md`.

### 5.2 Alertas de salud (HU-009)
- Email enviado vía **Resend**.
- Push enviado vía **Web Push API**.
- Disparadas por **Supabase Edge Functions** con cron job diario sobre `health_records`.
- El Tutor puede configurar preferencias por categoría mediante el panel de HU-009.

---

## 6. Seguridad en Almacenamiento

### 6.1 Supabase Storage — Buckets
El SDD define los siguientes buckets. Las políticas de acceso no están documentadas explícitamente en el SDD:

| Bucket | Contenido | Acceso esperado según SDD |
|---|---|---|
| `pets` | Foto de mascota | Tutor propietario (lectura pública posible en pasaporte) |
| `providers` | Galería comercial | Público (visible en búsquedas y perfiles) |
| `health-records` | Adjuntos clínicos | Privado — solo Tutor propietario y receptor del pasaporte compartido |
| `avatars` | Foto de perfil del Tutor | Público (confirmado por RFC-001, HU-002) |

Adicionalmente, la tabla `push_subscriptions` (RFC-001) requiere RLS por usuario (`user_id = auth.uid()`); ver §7 (S-001 / GAP-014) y ADR-002.

---

## 7. Hallazgos de Seguridad sin Especificar en el SDD

Los siguientes aspectos de seguridad son relevantes para el sistema pero no están documentados en el SDD v1.1. Se registran como pendientes de definición, no como decisiones tomadas.

| # | Aspecto | HU relacionada | GAP |
|---|---|---|---|
| S-001 | Política de Row Level Security (RLS) en Supabase | Todas | GAP-014 |
| S-002 | Cifrado o enmascaramiento de CUIT/DNI en base de datos | HU-005 | — |
| S-003 | Política de retención de datos personales | HU-001, HU-002 | — |
| S-004 | Revocación anticipada de enlace de pasaporte | HU-011 | — |
| S-005 | Logging de accesos al enlace de pasaporte | HU-011 | — |
| S-006 | Política de opt-in push notifications | HU-009, HU-012 | GAP-011 |
| S-007 | Rate limiting en endpoints de notificación masiva | HU-012 | GAP-004 (análisis) |
| S-008 | Validación técnica del CUIT/DNI del Proveedor | HU-005 | — |
| S-009 | Política de acceso al bucket `health-records` en Storage | HU-010 | — |
| S-010 | Moderación de contenido en reportes de mascotas perdidas (fotos) | HU-012, HU-014 | — |
