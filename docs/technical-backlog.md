# Technical Backlog — APPATITAS
**Versión:** 1.1
**Fuente:** `docs/SDD_MASTER.md` v1.2 · `docs/domain-map.md` · `docs/architecture/database.md` · `docs/rfcs/RFC-001..003`
**Fecha:** Mayo 2025 · Revisión: 2026-06-25 (RFC-001/002/003)
**Criterio de ordenamiento:** Dependencias técnicas. Una tarea no puede iniciarse hasta que sus dependencias estén resueltas.

Cada sprint entrega una capa funcional sobre la cual la siguiente puede construirse.
Los ítems marcados con `*` tienen gaps documentados en `docs/GAP_ANALYSIS.md`.

---

## Sprint 0 — Fundación de Infraestructura
**Duración estimada:** 1 semana
**Objetivo:** Dejar el entorno técnico completamente operativo antes de escribir una sola línea de lógica de negocio. Todo lo que se construya en los sprints siguientes depende de este sprint.

### Dependencias previas
Ninguna. Es el punto de partida absoluto.

### Tareas

#### S0-01 — Proyecto Supabase y configuración base
- Crear proyecto en Supabase (producción y staging).
- Habilitar la extensión PostGIS en la base de datos.
- Configurar variables de entorno del proyecto PWA.
- Establecer conexión entre la PWA y Supabase (cliente JS).

**Bloquea:** todo el resto del backlog.

#### S0-02 — Esquema de base de datos: tablas fundacionales
Crear en orden estricto de dependencias de foreign key:

1. `locations` — primera tabla, no tiene FK.
2. `users` — depende solo de Supabase Auth (UUID como PK).
3. `pets` — FK a `users`.
4. `providers` — FK a `users` y `locations`.
5. `service_areas` — FK a `providers`.
6. `schedules` — FK a `providers`.
7. `health_records` — FK a `pets`.
8. `passport_shares` — FK a `pets`.
9. `lost_reports` — FK a `users` (nullable) y `locations`.
10. `bookings` — FK a `users`, `providers`, `pets`.
11. `booking_status_events` — FK a `bookings`.
12. `push_subscriptions` — FK a `users` (RFC-001).
13. `user_roles` — FK a `users` (RFC-002).
14. `admin_audit_log` — FK a `users` (RFC-003).

**RFC aplicados (2026-06-25):**
- **RFC-001:** `users` se crea con el perfil del Tutor (`full_name`, `phone`, `avatar_url`, `location_id` → FK a `locations`) + tabla `push_subscriptions`.
- **RFC-002 (GAP-004):** `users` se crea **sin** la columna `role`; los roles viven en `user_roles`. El trigger de Auth inserta en `users` y en `user_roles`.
- **RFC-003 (GAP-005):** se agrega `admin_audit_log` (auditoría inmutable del Admin).

El esquema pasa de 11 a **14 tablas**. Ver `docs/rfcs/RFC-001..003` y `docs/architecture/database.md` §3.

**Bloquea:** toda operación de base de datos en sprints posteriores.

#### S0-03 — Índices espaciales PostGIS
- Crear índice GIST sobre `locations.coordinates`.
- Sin este índice las consultas `ST_DWithin` son full-scan y no escalan.

**Bloquea:** HU-012, HU-013, HU-014, HU-016.

#### S0-04 — Configuración de Supabase Auth
- Habilitar proveedor email/contraseña.
- Configurar OAuth 2.0 con Google.
- Configurar OAuth 2.0 con Facebook.
- Configurar plantilla de email de verificación (Resend como SMTP).

**Bloquea:** HU-001, HU-005.

#### S0-05 — Configuración de Supabase Storage
Cuatro buckets en total:
- Crear bucket `pets`.
- Crear bucket `providers`.
- Crear bucket `health-records` (adjuntos clínicos; nombre con guion, no `health_records`).
- Crear bucket `avatars` (foto de perfil del Tutor — HU-002, confirmado por RFC-001).
- Definir políticas de acceso por bucket (público vs privado).

**Bloquea:** HU-002, HU-003, HU-006, HU-010, HU-012.

#### S0-06 — Estructura de la PWA
- Scaffold del proyecto PWA (estructura de carpetas, router, estado global).
- Configurar Service Worker base.
- Configurar Web App Manifest.
- Configurar variables de entorno para staging y producción.

**Bloquea:** todo módulo de UI.

#### S0-07 — Integración Resend
- Cuenta y dominio verificado en Resend.
- Función utilitaria de envío de email usable desde Edge Functions.
- Plantilla base de email transaccional.

**Bloquea:** HU-001 (verificación), HU-009 (alertas de salud).

### Riesgos
- **PostGIS no disponible en el plan de Supabase seleccionado:** verificar antes de iniciar S0-02. Sin PostGIS, HU-012, HU-013, HU-014 y HU-016 no pueden implementarse.
- **OAuth Facebook requiere app aprobada:** el proceso de revisión de Meta puede demorar días. Iniciar S0-04 el primer día del sprint.
- **Definición de RLS pendiente (GAP-014):** el esquema puede crearse sin RLS, pero debe quedar documentado que las políticas son obligatorias antes de exponer datos en producción.

### Entregables
- Proyecto Supabase operativo (staging y producción).
- Esquema completo de base de datos con **14 tablas** (RFC-001/002/003) e índice GIST.
- Supabase Auth con los tres proveedores configurados.
- **Cuatro buckets** de Storage creados con políticas de acceso definidas (`pets`, `providers`, `health-records`, `avatars`).
- PWA scaffolded con Service Worker y Manifest.
- Resend integrado y verificado.

---

## Sprint 1 — Identidad y Perfiles Base (BC-01 y BC-02 núcleo)
**Duración estimada:** 2 semanas
**Objetivo:** Habilitar el registro, autenticación y los perfiles mínimos de Tutor y Mascota. Sin identidad no existe ninguna operación posterior. Sin mascota no existe el pasaporte de salud ni los reportes de pérdida.

### Dependencias previas
- Sprint 0 completo (Auth configurado, tablas `users`, `pets`, `locations` creadas, buckets listos).

### Tareas

#### S1-01 — Registro y autenticación de Tutor (HU-001)
- Pantalla de selección de rol ("Soy dueño de mascota" / "Ofrezco servicios").
- Formulario email/contraseña con validación.
- Botones OAuth Google y Facebook.
- INSERT en `users` + INSERT en `user_roles` con `role = 'tutor'` al completar el flujo (RFC-002).
- Pantalla de verificación de email pendiente.
- Bloqueo de acceso hasta `email_verified = true` (RN-004).

**Bloquea:** HU-002, HU-003, y todo lo que requiera sesión de Tutor.

#### S1-02 — Perfil de Tutor (HU-002)
- Formulario: nombre completo, teléfono (opcional), selector de barrio/zona de Córdoba.
- Subida de avatar a Supabase Storage.
- Banner persistente de progreso de perfil incompleto.
- INSERT/UPDATE en `users` y `locations`.

**Depende de:** S1-01.
**Bloquea:** HU-016 (la ubicación del Tutor es el origen de la búsqueda geoespacial).

#### S1-03 — Registro de Mascota (HU-003)
- Formulario: nombre, especie, raza, fecha de nacimiento, sexo, peso.
- Campos opcionales: color/marcas, microchip ID.
- Subida de foto al bucket `pets` (una sola foto — RN-024).
- INSERT en `pets` con `user_id` del Tutor autenticado.

**Depende de:** S1-01.
**Bloquea:** HU-007, HU-008, HU-010, HU-011, HU-012.

#### S1-04 — Edición y baja lógica de Mascota (HU-004)
- Formulario de edición de todos los campos de mascota.
- Baja: UPDATE `pets.deleted_at = now()`.
- Cascada: UPDATE `bookings.status = 'cancelled_by_tutor'` para reservas futuras activas de la mascota*. (La tabla `bookings` existe desde Sprint 0 aunque no esté operativa.)
- Modal de confirmación de baja.

**Depende de:** S1-03.

### Riesgos
- **Selector de barrios de Córdoba (HU-002):** requiere un listado curado de barrios de Córdoba Capital y Gran Córdoba. No está en el SDD. Debe obtenerse o construirse antes de este sprint.
- **Cascada de baja en HU-004 (GAP-006):** la tabla `bookings` existe pero sin reservas reales en Fase 1. La cascada debe implementarse de forma que no falle cuando no hay reservas que cancelar.

### Entregables
- Flujo de registro completo para Tutor (email, Google, Facebook).
- Verificación de email operativa.
- Perfil de Tutor con ubicación y avatar.
- CRUD completo de mascotas con baja lógica.
- Acceso autenticado y rutas protegidas funcionales en la PWA.

---

## Sprint 2 — Pasaporte Digital de Salud (BC-03)
**Duración estimada:** 2 semanas
**Objetivo:** Implementar el módulo de retención central de Fase 1. Permite al Tutor usar la app diariamente para gestionar la salud de su mascota, sin depender de ninguna funcionalidad de Proveedor ni de pagos.

### Dependencias previas
- S1-03 completo (`pets` con registros reales disponibles).
- S0-07 completo (Resend operativo para alertas de email).

### Tareas

#### S2-01 — Registro de vacunas (HU-007)
- Formulario: tipo de vacuna (selector fijo: Antirrábica, Séxtuple, Bordetella, Leishmaniasis, Otra), fecha de aplicación, fecha próxima dosis, veterinario, número de lote (opcional).
- INSERT en `health_records` con `type = 'vaccination'`.
- Listado cronológico descendente.
- Alerta visual `⚠️ Vence en X días` cuando `next_due_date < today + 30` (RN-022).

**Depende de:** S1-03.
**Bloquea:** HU-009 (el cron evalúa estos registros), HU-011 (el pasaporte los consolida).

#### S2-02 — Registro de desparasitaciones (HU-008)
- Formulario: tipo (interna / externa / ambas), selector de frecuencia (15, 30, 60, 90, 180 días — RN-011).
- Cálculo automático: `next_due_date = applied_date + frequency_days` (RN-010).
- INSERT en `health_records` con `type = 'deworming'`.

**Depende de:** S1-03.
**Bloquea:** HU-009.

#### S2-03 — Historial clínico (HU-010)
- Formulario: fecha, veterinario, motivo, diagnóstico, tratamiento, próxima cita (opcional).
- Adjuntos: hasta 3 archivos PDF/imagen, máx. 5 MB c/u (RN-023), subidos a Storage.
- INSERT en `health_records` con `type = 'clinical_visit'`.
- Vista de timeline cronológica.

**Depende de:** S1-03.
**Bloquea:** HU-011.

#### S2-04 — Sistema de alertas de salud (HU-009)
- Edge Function con cron job diario.
- Consulta: `health_records WHERE next_due_date IN (today+30, today+7, today)`.
- Canal email: envío vía Resend.
- Canal push: solicitud de permiso en PWA, registro de token de dispositivo*, envío vía Web Push API.
- Acción de snooze: UPDATE `next_due_date += 7 días` (RN-007).
- Panel de configuración de alertas por categorías* (GAP-010).

**Depende de:** S2-01, S2-02, S0-07.

#### S2-05 — Pasaporte compartido (HU-011)
- Vista consolidada: foto, datos descriptivos, última vacuna, vencimientos próximos, peso*, chip ID, marcas.
- Generación de hash seguro e INSERT en `passport_shares` con `expires_at = now() + 7 días`.
- Ruta pública `/passport/{hash}` accesible sin sesión (RN-009).
- Validación de expiración: si `expires_at < now()` → pantalla de enlace expirado.
- Selector de duración del enlace (hasta 7 días — RN-008).

**Depende de:** S2-01, S2-02, S2-03.

### Riesgos
- **Token de push en iOS (GAP-011):** Web Push en iPhone requiere que el usuario haya instalado la PWA en pantalla de inicio. Usuarios de iPhone que no lo hagan no recibirán alertas de salud por push. El email es el canal de respaldo.
- **Peso histórico en pasaporte (GAP-009):** HU-011 muestra "peso histórico" pero no existe HU de registro periódico de peso. Solo existe `weight_kg` estático de HU-003. En esta iteración el pasaporte muestra el peso de registro; el historial queda pendiente de especificación.
- **Panel de configuración de alertas (GAP-010):** las categorías configurables no están definidas en el SDD. Implementar un panel genérico de opt-in/opt-out por tipo de registro (`vaccination`, `deworming`) hasta que se especifique.

### Entregables
- Registro de vacunas, desparasitaciones e historial clínico operativo.
- Alertas automáticas por email y push en los tres momentos definidos.
- Snooze funcional desde la notificación.
- Pasaporte compartido con enlace público, expiración y vista sin sesión.

---

## Sprint 3 — Comunidad y Mascotas Perdidas (BC-04)
**Duración estimada:** 2 semanas
**Objetivo:** Implementar el módulo de crecimiento viral. Es el primer módulo con acceso público sin sesión y el primero en usar notificaciones push masivas geolocalizadas.

### Dependencias previas
- S0-03 completo (índice GIST sobre `locations.coordinates`).
- S1-01 completo (sesión de Tutor para reportes autenticados).
- S1-03 completo (`pets` disponibles para vinculación opcional en reportes).
- S2-04 completo (infraestructura de Web Push operativa — reutilizada aquí).

### Tareas

#### S3-01 — Reporte de mascota perdida (HU-012)
- Formulario: selector de mascota registrada u opción anónima, foto (Storage), datos descriptivos, pin en mapa, comportamiento, teléfono, recompensa opcional en ARS (solo informativa).
- INSERT en `lost_reports` con `type = 'lost'`, `status = 'lost'` y `location_id`.
- Edge Function disparada en el INSERT: consulta usuarios con ubicación en radio de 5 KM (`ST_DWithin`) y envía notificación push masiva (RN-012).

**Depende de:** S1-01, S1-03, S0-03, S2-04 (infraestructura push).
**Bloquea:** HU-015.

#### S3-02 — Mapa comunitario de alertas (HU-013)
- Ruta pública (sin sesión requerida — RN-015).
- Mapa interactivo con pines de `lost_reports` con `status = 'lost'`.
- Selector de radio: 5, 10 o 20 KM desde la ubicación actual del usuario (Geolocation API).
- Filtros: especie y rango de fechas.
- Card flotante al presionar un pin: foto, datos, botón "Tengo información" (redirige a formulario o abre WhatsApp).

**Depende de:** S0-03, S3-01 (para que haya datos que mostrar).

#### S3-03 — Reporte de mascota encontrada (HU-014)
- Formulario público (sin sesión — ciudadano anónimo).
- Campos: foto, especie, descripción física, pin en mapa, teléfono.
- INSERT en `lost_reports` con `type = 'found'`.
- Edge Function: `ST_DWithin` 3 KM sobre reportes abiertos (`status = 'lost'`) evaluando especie, raza y color* (RN-014).
- Notificación push a Tutores con búsquedas compatibles.

**Depende de:** S0-03, S2-04, S3-01 (para que haya reportes contra los que hacer matching).

#### S3-04 — Cierre de reporte por éxito (HU-015)
- Botón "¡La encontré!" visible solo al Tutor propietario del reporte.
- UPDATE `lost_reports.status = 'found'`.
- Edge Function: publicación automática de agradecimiento en feed de zona* (RN-026).

**Depende de:** S3-01.

### Riesgos
- **Notificaciones push masivas sin throttling (GAP-011):** en zonas densas un único reporte puede disparar miles de push simultáneos en la Edge Function. Definir límite máximo de destinatarios por evento antes de implementar S3-01.
- **Motor de coincidencias sin algoritmo (GAP-012):** el SDD no especifica cómo evaluar "raza aparente" de forma automatizada. Implementar el matching sobre especie (exacto) y color (texto libre — búsqueda parcial). La evaluación de raza queda como mejora futura hasta que se especifique.
- **Feed de zona (GAP-015):** el "feed de la zona" de HU-015 no está definido en el SDD. La Edge Function de S3-04 puede emitir el evento sin implementar el feed si este componente no existe aún.
- **Usuarios sin token push:** el push masivo de S3-01 solo llega a usuarios que otorgaron permiso. No hay canal de respaldo para HU-012 (a diferencia de HU-009 que tiene email).

### Entregables
- Reporte de mascota perdida con notificación push masiva geolocalizada.
- Mapa comunitario público con filtros y cards interactivas.
- Formulario público de mascota encontrada con motor de coincidencias básico.
- Cierre de reporte operativo.

---

## Sprint 4 — Perfiles de Proveedor y Onboarding (BC-02 comercial)
**Duración estimada:** 2 semanas
**Objetivo:** Completar el perfil del lado de la oferta. Los Proveedores deben tener datos, galería y horarios cargados antes de que la búsqueda de HU-016 pueda devolver resultados útiles. Este sprint prepara los datos que BC-05 consumirá en Sprint 5.

### Dependencias previas
- S1-01 completo (Auth operativo, flujo de selección de rol funcional).
- S0-05 completo (bucket `providers` en Storage).
- S0-03 completo (índice GIST para la ubicación del Proveedor).

### Tareas

#### S4-01 — Registro de Proveedor (HU-005)
- Formulario diferenciado (activado desde la selección "Ofrezco servicios" en HU-001).
- Campos: nombre del negocio, descripción (máx. 500 car.), selector múltiple de categorías, CUIT/DNI, radio de cobertura en KM, pin de ubicación en mapa o dirección.
- INSERT en `user_roles` (`role = 'provider'`, acumulable · RFC-002), `providers` (`status = 'pending_approval'` — RN-025), `locations`.
- Pantalla de confirmación: estado pendiente de aprobación visible para el Proveedor.
- La aprobación la realiza el Admin mediante **HU-020** (ver Módulo de Administración), que registra la acción en `admin_audit_log`.

**Bloquea:** HU-006, HU-016.
**Requiere:** HU-018 y HU-020 (Admin) operativos para que el Proveedor pueda pasar a `active`.

#### S4-02 — Galería comercial del Proveedor (HU-006)
- Subida de hasta 6 fotos al bucket `providers` con contador (RN-017).
- Rechazo de la séptima foto con mensaje de error.
- Visualización y eliminación de fotos existentes.

**Depende de:** S4-01.

#### S4-03 — Grilla de horarios del Proveedor (HU-006)
- Grilla semanal (lunes a domingo).
- Toggle "Cerrado" por día (UPDATE `schedules.is_closed`).
- Selector de bloques de 30 minutos por día activo.
- INSERT/UPDATE en `schedules`.

**Depende de:** S4-01.
**Bloquea:** HU-016 (próximo horario disponible en tarjeta), HU-017 (base del sistema de turnos).

### Riesgos
- **Dependencia del Módulo de Administración (GAP-005, resuelto por RFC-003):** la aprobación de Proveedores la ejecuta el Admin vía HU-020. El módulo Admin (HU-018..021) debe estar operativo antes o durante este sprint para que ningún Proveedor quede bloqueado en `pending_approval` y HU-016 tenga oferta. Ya no es un panel "sin HU"; está especificado en `docs/SDD_MASTER.md` §6.
- **CUIT/DNI sin validación técnica:** el SDD indica "validación diferida por Admin". No implementar validación técnica del CUIT/DNI en este sprint; almacenar el valor como texto. El Admin lo revisa manualmente en HU-020.
- **Roles múltiples (GAP-004, resuelto por RFC-002):** un Proveedor puede además ser Tutor. El registro agrega `role='provider'` en `user_roles` sin reemplazar `tutor`. La UI necesita un selector de "rol activo".

### Entregables
- Flujo completo de registro de Proveedor con estado `pending_approval`.
- Interfaz mínima de Admin para aprobar Proveedores (funcional aunque sin historia de usuario formal).
- Galería comercial con límite de 6 fotos.
- Grilla semanal de horarios con bloques de 30 minutos.
- Al menos un Proveedor en estado `active` para que Sprint 5 tenga datos contra los que trabajar.

---

## Sprint 5 — Marketplace: Búsqueda y Reservas (BC-05)
**Duración estimada:** 2 semanas
**Objetivo:** Implementar los módulos de monetización de Fase 2. Este sprint solo puede iniciarse cuando existen Proveedores activos con horarios cargados y la integración con Mercado Pago Marketplace está aprobada.

### Dependencias previas
- Sprint 4 completo (Proveedores `active` con `schedules` y `locations` cargados).
- S1-02 completo (ubicación del Tutor disponible para `ST_DWithin`).
- S0-03 completo (índice GIST).
- Cuenta de Mercado Pago Marketplace aprobada (proceso externo — iniciar en Sprint 0 o Sprint 1 en paralelo).

### Tareas

#### S5-01 — Búsqueda geolocalizada de Proveedores (HU-016)
- Selector de categoría de servicio.
- Selector de mascota (filtra proveedores por especie compatible — RN-019).
- Consulta PostGIS: `ST_DWithin(provider.location, tutor.location, radius_meters)`.
- Ordenamiento: distancia ASC, `rating_avg` DESC (RN-020).
- Filtros avanzados: precio máximo, disponibilidad horaria, umbral de rating.
- Toggle vista mapa / listado de tarjetas.
- Tarjeta de Proveedor: foto, nombre, categorías, rating*, distancia, tarifa base, próximo horario, sello "Verificado" (RN-021).
- Geolocation API del navegador con fallback a ubicación del perfil del Tutor.

**Depende de:** Sprint 4 (Proveedores activos), S1-02 (ubicación Tutor).

#### S5-02 — Vista de agenda y disponibilidad (HU-017)
- Vista de calendario del Proveedor seleccionado.
- Slots disponibles derivados de `schedules` (bloques de 30 min, excluyendo los ya reservados en `bookings`).
- Selector de fecha y horario.

**Depende de:** S5-01, S4-03.

#### S5-03 — Reserva de turno con pago (HU-017)*
- Resumen de reserva: mascota, servicio, proveedor, fecha/hora, precio.
- Flujo de pago delegado a Mercado Pago Marketplace.
- INSERT en `bookings` con `status` inicial.
- INSERT en `booking_status_events` (auditoría del estado inicial).
- Confirmación de reserva para el Tutor.

**Depende de:** S5-02, cuenta de Mercado Pago Marketplace aprobada.

**Nota:** Los criterios de aceptación de HU-017 no están especificados en el SDD (GAP-001). El ciclo de vida de estados de `bookings` no está documentado (GAP-007). El mecanismo de verificación de servicio y liberación de fondos tampoco (GAP-003). Estos tres gaps deben resolverse antes de iniciar S5-03.

### Riesgos
- **Cuenta Mercado Pago Marketplace (GAP-002, ADR-004):** si la aprobación de Mercado Pago no está lista al inicio del Sprint 5, S5-03 no puede implementarse. S5-01 y S5-02 pueden avanzar sin el gateway de pagos.
- **HU-017 sin criterios de aceptación (GAP-001):** es el gap más crítico del backlog. S5-03 depende de que GAP-001, GAP-003 y GAP-007 estén resueltos antes de este sprint.
- **Sistema de valoraciones (GAP-008):** `rating_avg` se muestra en la tarjeta de Proveedor (HU-016) pero no existe módulo de valoraciones en el SDD. En este sprint, mostrar `rating_avg = null` o `—` hasta que se especifique el módulo.
- **Concurrencia en reservas:** dos Tutores pueden intentar reservar el mismo slot simultáneamente. El SDD no documenta el manejo de concurrencia. Implementar con bloqueo optimista o transacción atómica en base de datos.

### Entregables
- Búsqueda de Proveedores por proximidad con filtros y doble vista (mapa/lista).
- Sello "Verificado" funcional.
- Vista de agenda con slots disponibles del Proveedor.
- Reserva de turno con pago integrado (condicionado a aprobación de Mercado Pago).
- Auditoría de estados en `booking_status_events`.

---

## Módulo de Administración (RFC-003 — HU-018 a HU-021)

El actor Admin (GAP-005, resuelto) es transversal. Sus historias se ubican en el cronograma según qué desbloquean:

| Tarea | HU | Ubicación | Razón |
|---|---|---|---|
| **ADM-01** Acceso y permisos de Admin (área `/admin`, `has_role('admin')`, asignación de rol) | HU-018 | Sprint 1 (base, junto a Auth) | Prerrequisito de todas las demás capacidades de Admin |
| **ADM-02** Aprobación y gestión de Proveedores (aprobar/rechazar, sello "Verificado") | HU-020 | Sprint 4 (con BC-02 comercial) | Sin esto ningún Proveedor pasa a `active`; bloquea Sprint 5 |
| **ADM-03** Moderación de reportes de la comunidad | HU-021 | Sprint 3 (con BC-04) | Modera el contenido público que genera ese sprint |
| **ADM-04** Panel de control y monitoreo de transacciones | HU-019 | Sprint 1 (métricas base) → Sprint 5 (transacciones) | El monitoreo de reservas requiere `bookings` reales (Fase 2) |

**Tablas:** `user_roles` y `admin_audit_log` se crean en Sprint 0 (RFC-002/003). Cada acción de ADM-02/ADM-03 escribe en `admin_audit_log`. La RLS de estas tablas y la función `has_role()` se definen junto con la RLS general (cierre de Sprint 1).

**Asignación del primer Admin:** se realiza manualmente vía SQL/Studio en Sprint 0 o Sprint 1 (insertar `role='admin'` en `user_roles` para la cuenta del equipo), ya que el rol admin nunca es autoservicio.

---

## Resumen de Dependencias Críticas

```
Sprint 0 (Infraestructura)
    │
    ├──► Sprint 1 (Identidad + Mascotas)
    │         │
    │         ├──► Sprint 2 (Salud)
    │         │
    │         ├──► Sprint 3 (Comunidad) ◄── requiere S0-03 + S2-04
    │         │
    │         └──► Sprint 4 (Proveedores)
    │                   │
    │                   └──► Sprint 5 (Marketplace) ◄── requiere S1-02 + Mercado Pago
```

## Prerequisitos Externos (fuera del control del equipo)

| Prerequisito | Bloquea | Acción recomendada |
|---|---|---|
| Revisión de app Facebook (OAuth) | Sprint 1 completo | Iniciar en día 1 de Sprint 0 |
| Aprobación cuenta Mercado Pago Marketplace | S5-03 | Iniciar en Sprint 0 o Sprint 1 en paralelo |
| Resolución GAP-001 (criterios HU-017) | S5-03 | Resolver antes de iniciar Sprint 5 |
| Resolución GAP-003 (verificación de servicio) | S5-03 | Resolver antes de iniciar Sprint 5 |
| Resolución GAP-007 (estados de reserva) | S5-03 | Resolver antes de iniciar Sprint 5 |
| Listado de barrios de Córdoba | Sprint 1 (HU-002) | Obtener antes de iniciar Sprint 1 |

## Gaps que Bloquean Sprints

| GAP | Descripción | Sprint bloqueado |
|---|---|---|
| GAP-001 | HU-017 sin criterios de aceptación | Sprint 5 (S5-03) |
| GAP-003 | Verificación de servicio y liberación de fondos sin definir | Sprint 5 (S5-03) |
| ~~GAP-005~~ | ~~Sin HU de Admin para aprobación de Proveedores~~ ✅ Resuelto por RFC-003 (HU-018..021) | ~~Sprint 4~~ |
| GAP-007 | Ciclo de vida de estados de reserva no documentado | Sprint 5 (S5-03) |
| GAP-010 | Categorías del panel de alertas sin especificar | Sprint 2 (S2-04) |
| GAP-012 | Algoritmo del motor de coincidencias sin definir | Sprint 3 (S3-03) |

---

## Reconciliación de Cronograma con el Roadmap del SDD

La suma de los sprints técnicos (Sprint 0: 1 semana + Sprints 1–5: 2 semanas c/u) da **11 semanas de esfuerzo de desarrollo**. El roadmap del SDD_MASTER expresa el plazo en meses calendario: **Fase 1 en meses 1–4** y **Fase 2 en meses 5–9**.

No hay contradicción: las 11 semanas son tiempo de desarrollo neto; el roadmap en meses incluye además procesos externos no codificables (revisión de Meta para Facebook OAuth, aprobación de la cuenta Mercado Pago Marketplace, verificación DNS de Resend, resolución de los gaps críticos por el área de negocio) y los márgenes de QA, pruebas con usuarios y despliegue.

**Alineación de expectativas:**

| Fase del roadmap | Sprints técnicos | Meses calendario (SDD) |
|---|---|---|
| Fase 1 — MVP | Sprint 0, 1, 2, 3, 4 | Meses 1–4 |
| Fase 2 — Marketplace | Sprint 5 | Meses 5–9 (condicionado a Mercado Pago y gaps críticos) |

El equipo debe planificar contra los **meses del roadmap**, no contra las 11 semanas netas, para absorber los tiempos externos.
