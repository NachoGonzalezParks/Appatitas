# Matriz de Trazabilidad — APPATITAS
**Versión:** 2.2
**Fuente:** `docs/SDD_MASTER.md` v1.2 · `docs/rfcs/RFC-001..003`
**Fecha:** Mayo 2025 · Revisión: 2026-06-25 (RFC-001/002/003)

Toda referencia a reglas, tablas, APIs y componentes UI deriva exclusivamente del SDD_MASTER.
Los elementos marcados con `*` están referenciados en el SDD pero sin especificación completa (ver `docs/GAP_ANALYSIS.md`).

---

## Convenciones

| Símbolo | Significado |
|---|---|
| `*` | Elemento referenciado en el SDD pero sin especificación completa |
| — | No aplica para esta HU |

---

## HU-001 — Registro de Tutor

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-004 (verificación de email obligatoria), RN-005 (email único) |
| **Tablas** | `users` (INSERT: id, email, email_verified), `user_roles` (INSERT: role = 'tutor' — RFC-002) |
| **APIs / Servicios** | Supabase Auth (OAuth 2.0 Google, OAuth 2.0 Facebook, email+contraseña), Resend (email de verificación) |
| **Componentes UI** | Pantalla de selección de rol ("Soy dueño de mascota" / "Ofrezco servicios"), Formulario de registro email/contraseña, Botones OAuth Google y Facebook, Pantalla de verificación de email pendiente |

---

## HU-002 — Completar Perfil de Tutor

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | — |
| **Tablas** | `users` (UPDATE: `full_name`, `phone`, `avatar_url`, `location_id` — columnas de RFC-001), `locations` (INSERT: barrio/zona, ciudad) |
| **APIs / Servicios** | Supabase Storage (bucket `avatars` — confirmado por RFC-001), Supabase Auth (sesión activa) |
| **Componentes UI** | Formulario de perfil (nombre, teléfono, selector de barrio/zona de Córdoba), Selector de foto de avatar, Banner de progreso de perfil incompleto (porcentaje) |

---

## HU-003 — Registro de Mascota

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-016 (sin límite de mascotas en Fase 1), RN-024 (foto única por mascota) |
| **Tablas** | `pets` (INSERT: name, species, breed, birth_date, sex, weight_kg, color_marks, microchip_id, photo_url, user_id) |
| **APIs / Servicios** | Supabase Storage (bucket `pets`) |
| **Componentes UI** | Formulario de mascota (nombre, selector de especie, selector de raza con opción "mestizo", fecha de nacimiento, sexo, peso), Selector de foto, Campo opcional de chip/microchip |

---

## HU-004 — Edición y Baja de Mascota

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-003 (eliminación lógica con cascada de reservas) |
| **Tablas** | `pets` (UPDATE: campos editables; UPDATE: deleted_at al dar de baja), `bookings` (UPDATE: status = 'cancelled_by_tutor' en cascada`*`) |
| **APIs / Servicios** | Supabase Auth (sesión activa), Supabase DB (transacción atómica para cascada`*`) |
| **Componentes UI** | Formulario de edición de mascota, Botón "Dar de baja", Modal de confirmación de baja, Indicador de baja procesada |

---

## HU-005 — Registro de Proveedor

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-002 (invisible hasta estado active), RN-025 (estado inicial pending_approval) |
| **Tablas** | `user_roles` (INSERT: role = 'provider' — acumula sobre 'tutor' si existía · RFC-002), `providers` (INSERT: business_name, description, categories, cuit_dni, radius_km, location_id, status = 'pending_approval', onboarding_status, billing_email, payout_method), `locations` (INSERT: coordenadas o dirección) |
| **APIs / Servicios** | Supabase Auth (OAuth 2.0 o email+contraseña), API de geolocalización nativa / input de dirección |
| **Componentes UI** | Pantalla de selección de flujo ("Soy dueño" / "Ofrezco servicios"), Formulario de registro de proveedor (nombre del negocio, descripción, selector múltiple de categorías, CUIT/DNI, descripción 500 car.), Selector de radio de cobertura en KM, Input de ubicación con pin en mapa o dirección, Pantalla de confirmación (estado pending_approval) |

---

## HU-006 — Galería Comercial y Horarios del Proveedor

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-017 (máximo 6 fotos), RN-018 (grilla semanal en bloques de 30 minutos) |
| **Tablas** | `providers` (UPDATE: referencias a fotos en Storage), `schedules` (INSERT/UPDATE: day_of_week, is_closed, blocks por día) |
| **APIs / Servicios** | Supabase Storage (bucket `providers`, máx. 6 archivos), Supabase Auth (sesión de Proveedor activo) |
| **Componentes UI** | Galería de carga de fotos con contador (X/6), Grilla semanal (lunes a domingo), Toggle "Cerrado" por día, Selector de bloques horarios de 30 minutos por día |

---

## HU-007 — Control de Vacunación

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-022 (alerta visual a < 30 días del vencimiento) |
| **Tablas** | `health_records` (INSERT: pet_id, type = 'vaccination', applied_date, next_due_date, vaccine_type, vet_name, batch_number) |
| **APIs / Servicios** | Supabase Auth (sesión de Tutor) |
| **Componentes UI** | Formulario de vacuna (selector de tipo, fecha de aplicación, fecha próxima dosis, nombre del veterinario, número de lote opcional), Listado cronológico descendente de vacunas, Indicador de alerta `⚠️ Vence en X días` (cuando < 30 días) |

---

## HU-008 — Registro de Desparasitaciones

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-010 (next_due_date = applied_date + frequency_days), RN-011 (frecuencias válidas: 15, 30, 60, 90, 180 días) |
| **Tablas** | `health_records` (INSERT: pet_id, type = 'deworming', applied_date, next_due_date, frequency_days, deworming_type) |
| **APIs / Servicios** | Supabase Auth (sesión de Tutor) |
| **Componentes UI** | Formulario de desparasitación (selector tipo: interna / externa / ambas, selector de frecuencia con valores fijos), Campo de fecha de aplicación, Cálculo automático y display de next_due_date |

---

## HU-009 — Sistema de Alertas de Salud

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-006 (alertas a 30/7/0 días del vencimiento), RN-007 (snooze +7 días) |
| **Tablas** | `health_records` (READ: next_due_date para evaluación diaria; UPDATE: next_due_date += 7 días al hacer snooze), `push_subscriptions` (READ: suscripciones del Tutor para el canal push — RFC-001) |
| **APIs / Servicios** | Supabase Edge Functions (cron job diario), Resend (envío de email), Web Push API (notificación push al dispositivo, lee `push_subscriptions`) |
| **Componentes UI** | Panel de configuración de alertas por categorías`*`, Notificación push con acción de snooze interactivo, Email de alerta con enlace de snooze`*` |

---

## HU-010 — Historial Clínico y Consultas

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-023 (máx. 3 adjuntos, 5 MB c/u, PDF o imagen) |
| **Tablas** | `health_records` (INSERT: pet_id, type = 'clinical_visit', applied_date, next_due_date, vet_name, visit_reason, diagnosis, treatment) |
| **APIs / Servicios** | Supabase Storage (adjuntos clínicos, bucket no nombrado en SDD`*`), Supabase Auth (sesión de Tutor) |
| **Componentes UI** | Formulario de consulta (fecha, profesional, motivo, diagnóstico, tratamiento, próxima cita opcional), Selector de adjuntos (hasta 3, PDF/imagen), Vista de línea de tiempo (timeline) cronológica |

---

## HU-011 — Compartir Pasaporte de Salud

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-008 (enlace expira en 7 días corridos), RN-009 (acceso sin sesión para el receptor) |
| **Tablas** | `pets` (READ), `health_records` (READ: última vacuna, vencimientos, peso`*`), `passport_shares` (INSERT: pet_id, hash, expires_at) |
| **APIs / Servicios** | — (el enlace `/passport/{hash}` es una ruta pública de la PWA sin API externa) |
| **Componentes UI** | Vista consolidada del pasaporte (foto, datos descriptivos, última vacuna, alertas de vencimiento, peso histórico`*`, chip ID, marcas), Botón "Compartir" con generación de enlace, Selector de duración del enlace (hasta 7 días), Display del enlace copiable `/passport/{hash}` |

---

## HU-012 — Reportar Mascota Perdida

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-012 (push masivo a usuarios en 5 KM), RN-013 (ciclo lost → found → closed) |
| **Tablas** | `lost_reports` (INSERT: user_id, pet_id, type = 'lost', status = 'lost', photo_url, name, species, breed, color, sex, incident_date, location_id, behavior, contact_phone, reward_ars), `locations` (INSERT: última ubicación), `push_subscriptions` (READ: destinatarios en radio 5 KM — RFC-001) |
| **APIs / Servicios** | Supabase Storage (foto de la mascota), API de geolocalización nativa (pin en mapa), Web Push API (notificación masiva 5 KM, lee `push_subscriptions`), Supabase Edge Functions (dispara la notificación masiva) |
| **Componentes UI** | Formulario de reporte (selector de mascota registrada u opción anónima, foto, datos descriptivos, pin en mapa, comportamiento, teléfono, recompensa opcional en ARS), Confirmación de publicación |

---

## HU-013 — Mapa Comunitario de Alertas

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-015 (módulo público sin sesión requerida) |
| **Tablas** | `lost_reports` (READ: status = 'lost', coordinates, species, incident_date), `locations` (READ: coordenadas de los reportes) |
| **APIs / Servicios** | API de geolocalización nativa del navegador (ubicación del usuario), PostGIS `ST_DWithin` (filtro por radio seleccionado) |
| **Componentes UI** | Mapa interactivo con pines de reportes activos, Selector de radio (5 / 10 / 20 KM), Filtros por especie y rango de fechas, Tarjeta flotante (card) al presionar un pin (foto, datos, botón "Tengo información" → formulario o WhatsApp) |

---

## HU-014 — Reportar Mascota Encontrada

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-014 (motor de coincidencias en radio de 3 KM) |
| **Tablas** | `lost_reports` (INSERT: type = 'found', photo_url, species, color, location_id, contact_phone; READ: reportes abiertos con status = 'lost' para matching), `locations` (INSERT: punto de hallazgo), `push_subscriptions` (READ: suscripciones de Tutores con reportes compatibles — RFC-001) |
| **APIs / Servicios** | Supabase Storage (foto de mascota encontrada), API de geolocalización nativa (pin en mapa), PostGIS `ST_DWithin` 3 KM (motor de coincidencias), Supabase Edge Functions (ejecuta matching y notifica), Web Push API (notificación a Tutores con búsquedas compatibles, lee `push_subscriptions`) |
| **Componentes UI** | Formulario simplificado (foto, especie, descripción física, pin en mapa, teléfono), Confirmación de envío, Pantalla de matches sugeridos`*` |

---

## HU-015 — Cierre de Reporte por Éxito

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-013 (transición a estado found, luego closed), RN-026 (publicación automática en feed de zona) |
| **Tablas** | `lost_reports` (UPDATE: status = 'found') |
| **APIs / Servicios** | Supabase Auth (sesión del Tutor propietario del reporte), Supabase Edge Functions (genera publicación de agradecimiento en feed`*`) |
| **Componentes UI** | Botón "¡La encontré!" en el detalle del reporte propio, Modal de confirmación, Pantalla de cierre exitoso, Publicación automática en feed de zona`*` |

---

## HU-016 — Localización Inteligente de Prestadores

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-019 (filtro por especie de mascota), RN-020 (orden: distancia primario, rating secundario), RN-021 (sello "Verificado") |
| **Tablas** | `providers` (READ: status = 'active', categories, rating_avg`*`, location_id), `locations` (READ: coordenadas de proveedores), `schedules` (READ: próximo horario disponible), `service_areas` (READ: cobertura granular`*`) |
| **APIs / Servicios** | PostGIS `ST_DWithin` + `ST_Distance` (filtro y orden geoespacial), API de geolocalización nativa (coordenadas del Tutor como fallback de perfil) |
| **Componentes UI** | Selector de categoría de servicio (Peluquería, Paseos, Guardería, Veterinaria, Adiestramiento), Selector de mascota (filtra por especie), Toggle vista mapa / listado de tarjetas, Tarjeta de Proveedor (foto, nombre, categorías, rating, tarifa base, distancia, próximo horario disponible, sello "Verificado"), Filtros avanzados (precio máximo, disponibilidad, umbral de rating) |

---

## HU-017 — Reserva de Turnos y Confirmación

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-001 (comisión solo sobre servicio verificado`*`), RN-003 (cascada de baja de mascota) |
| **Tablas** | `bookings` (INSERT: tutor_id, provider_id, pet_id, status, scheduled_at), `booking_status_events` (INSERT: auditoría de cada transición de estado), `schedules` (READ: disponibilidad del Proveedor) |
| **APIs / Servicios** | Mercado Pago Marketplace (procesamiento del pago y escrow`*`), Supabase Auth (sesión de Tutor) |
| **Componentes UI** | Vista de agenda del Proveedor con slots disponibles (bloques de 30 min), Selector de fecha y horario, Resumen de reserva (mascota, servicio, proveedor, precio), Flujo de pago (Mercado Pago`*`), Confirmación de reserva`*` |

---

## HU-018 — Acceso y Permisos de Administrador (RFC-003)

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-004 (verificación de email), regla derivada: rol `admin` solo manual |
| **Tablas** | `user_roles` (READ: verificar `role = 'admin'`; INSERT: asignar admin a otro usuario), `admin_audit_log` (INSERT: `role_granted`) |
| **APIs / Servicios** | Supabase Auth (sesión), función RLS `has_role()` |
| **Componentes UI** | Guard de área `/admin`, pantalla de acceso denegado para no-admin, gestión de roles de usuarios |

---

## HU-019 — Panel de Control y Monitoreo de Transacciones (RFC-003)

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | — (solo lectura) |
| **Tablas** | `users`, `providers`, `lost_reports` (READ: métricas agregadas), `bookings`, `booking_status_events` (READ: monitoreo de transacciones — Fase 2) |
| **APIs / Servicios** | Supabase Auth (sesión admin), consultas agregadas |
| **Componentes UI** | Dashboard con métricas, listado de reservas con estado e historial de transiciones |

---

## HU-020 — Aprobación y Gestión de Proveedores (RFC-003)

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-002 (visibilidad), RN-025 (estado inicial), RN-021 (sello "Verificado") |
| **Tablas** | `providers` (UPDATE: status, onboarding_status, verified), `admin_audit_log` (INSERT: `provider_approved`/`provider_rejected`/`verified_badge_granted`) |
| **APIs / Servicios** | Supabase Auth (sesión admin), función RLS `has_role('admin')` |
| **Componentes UI** | Listado de Proveedores `pending_approval`, detalle con datos comerciales y CUIT/DNI, acciones aprobar/rechazar (con motivo), toggle sello "Verificado" |

---

## HU-021 — Moderación de Reportes de la Comunidad (RFC-003)

| Dimensión | Elementos |
|---|---|
| **Reglas de negocio** | RN-013 (ciclo de vida del reporte), RN-015 (mapa público) |
| **Tablas** | `lost_reports` (UPDATE: status por moderación), `admin_audit_log` (INSERT: `report_hidden`) |
| **APIs / Servicios** | Supabase Auth (sesión admin), función RLS `has_role('admin')` |
| **Componentes UI** | Cola de moderación de reportes, acción de ocultar/cerrar con motivo, confirmación |

---

## Resumen Cruzado

### Tablas por frecuencia de acceso

| Tabla | HU que la afectan |
|---|---|
| `users` | HU-001, HU-002, HU-005 |
| `pets` | HU-003, HU-004, HU-011, HU-012 |
| `providers` | HU-005, HU-006, HU-016, HU-017 |
| `locations` | HU-002, HU-003, HU-005, HU-012, HU-013, HU-014, HU-016 |
| `health_records` | HU-007, HU-008, HU-009, HU-010, HU-011 |
| `schedules` | HU-006, HU-016, HU-017 |
| `lost_reports` | HU-012, HU-013, HU-014, HU-015 |
| `bookings` | HU-004 (cascada), HU-017 |
| `booking_status_events` | HU-017 |
| `passport_shares` | HU-011 |
| `service_areas` | HU-005, HU-016 |
| `push_subscriptions` | HU-009, HU-012, HU-014 (RFC-001) |
| `user_roles` | HU-001, HU-005, HU-018 (RFC-002) |
| `admin_audit_log` | HU-018, HU-020, HU-021 (RFC-003) |

### APIs / Servicios externos por frecuencia de uso

| Servicio | HU que lo invocan |
|---|---|
| Supabase Auth | HU-001, HU-002, HU-004, HU-005, HU-006, HU-007, HU-008, HU-009, HU-010, HU-011, HU-015, HU-017 |
| Supabase Storage | HU-002, HU-003, HU-005, HU-006, HU-010, HU-012, HU-014 |
| Supabase Edge Functions | HU-009, HU-012, HU-014, HU-015, HU-017 |
| PostGIS (`ST_DWithin`) | HU-012, HU-013, HU-014, HU-016 |
| Web Push API | HU-009, HU-012, HU-014 |
| Resend (email) | HU-001, HU-009 |
| API Geolocalización nativa | HU-012, HU-013, HU-016 |
| Mercado Pago Marketplace | HU-017 |

### Elementos sin especificación completa en el SDD (`*`)

| Elemento | HU | GAP |
|---|---|---|
| Cascada de cancelación de reservas en baja de mascota | HU-004 | GAP-006 |
| Tabla/bucket de adjuntos clínicos | HU-010 | — |
| Peso histórico de mascota | HU-011 | GAP-009 |
| Panel de configuración de alertas (categorías y opt-in) | HU-009 | GAP-010 |
| Sistema de valoraciones (`rating_avg`) | HU-016 | GAP-008 |
| Feed de zona | HU-015 | GAP-015 |
| Ciclo de vida completo de estados de reserva | HU-017 | GAP-007 |
| Flujo de pago y confirmación de reserva | HU-017 | GAP-001, GAP-003 |
| Pantalla de matches sugeridos en mascota encontrada | HU-014 | GAP-012 |
