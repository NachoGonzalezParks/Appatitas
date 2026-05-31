# Software Design Document (SDD) - Master File
## Proyecto: APPATITAS (Marketplace Transaccional de Servicios para Mascotas)

---

## 1. Información del Documento y Metadatos
* **Versión:** 1.1
* **Fecha:** Mayo 2025
* **Equipo:** 3 Desarrolladores (Dev) + 1 Comercial
* **Stack Tecnológico:** Progressive Web App (PWA) · Supabase (PostgreSQL + PostGIS + Auth + Storage + Edge Functions) · Mercado Pago (Marketplace/Gateway)
* **Ámbito Geográfico Inicial:** Córdoba, Argentina

### Notas sobre la Versión 1.1
Este documento integra las siguientes optimizaciones sobre la arquitectura inicial:
1. **Tabla `locations` reutilizable:** Geolocalización centralizada para todas las entidades.
2. **Enriquecimiento de `providers`:** Campos críticos de negocio (`billing_email`, `payout_method`, `onboarding_status`).
3. **Tabla `booking_status_events`:** Sistema de auditoría para el seguimiento estricto de estados de reservas.
4. **Tabla `service_areas`:** Estructura preparada para definir coberturas granulares en fases futuras.

---

## 2. Modelo de Negocio y Matriz de Actores

### 2.1 Flujo de Valor
Appatitas opera como un **Marketplace Transaccional de Servicios** donde la plataforma retiene una comisión sobre cada transacción completada con éxito entre el Tutor y el Proveedor.
1. El Tutor busca un servicio específico.
2. Encuentra un Proveedor disponible dentro de Appatitas.
3. Realiza la reserva del turno y procesa el pago.
4. Appatitas retiene de forma segura la comisión estipulada.
5. Se libera el saldo restante al Proveedor una vez que el servicio es verificado como realizado.

### 2.2 Matriz de Actores

| Actor | Rol | Relación con el Negocio |
| :--- | :--- | :--- |
| **Tutor** | Dueño de la mascota. Consume servicios. | Usuario de demanda (Acceso gratuito). |
| **Mascota** | Sujeto del servicio. Entidad con perfil digital. | Entidad dependiente del Tutor. |
| **Proveedor** | Profesionales del rubro (Paseador, peluquería, veterinario, etc.). | Cliente comercial (B2B) que genera el *revenue* (ingresos). |
| **Admin** | Equipo interno de Appatitas. Gestiona la plataforma. | Operador y moderador del marketplace. |

---

## 3. Roadmap de Desarrollo

| Fase | Objetivo Principal | KPIs de Éxito | Duración Estimada |
| :--- | :--- | :--- | :--- |
| **Fase 1 — MVP** | Tráfico orgánico y retención de usuarios. | MAU, nuevos registros, interacciones diarias. | Meses 1–4 |
| **Fase 2 — Marketplace** | Monetización activa mediante el cobro de comisiones. | GMV, tasa de conversión, NPS. | Meses 5–9 |
| **Fase 3 — Expansión** | Apertura de nuevas ciudades y verticales de negocio. | Revenue por ciudad, captación de Proveedores Premium. | Meses 10+ |

---

## 4. Fase 1 — Historias de Usuario (MVP)
*Principio Rector:* Generar hábito de uso recurrente antes de monetizar. Las funcionalidades de la Fase 1 son gratuitas, orientadas a consolidar la base de datos geolocalizada.

### 4.1 Módulo: Registro y Gestión de Perfiles

#### HU-001: Registro de Tutor
* **Como** visitante,
* **quiero** registrarme con email/contraseña o mediante credenciales de Google/Facebook,
* **para** acceder a la plataforma de forma rápida y sin fricciones.
* **Criterios de Aceptación:**
  * Integración de OAuth 2.0 con Google y Facebook utilizando Supabase Auth.
  * Validación estricta de email único en el sistema.
  * Creación automática de un registro en la tabla `users` con el atributo `role = 'tutor'` al completar el flujo.
  * Envío y verificación de email obligatorio antes de habilitar el acceso completo.

#### HU-002: Completar Perfil de Tutor
* **Como** Tutor registrado,
* **quiero** completar mi perfil con nombre, foto, ubicación y datos de contacto,
* **para** que los Proveedores contratados puedan identificarme correctamente.
* **Criterios de Aceptación:**
  * Campos requeridos: nombre completo, avatar (Supabase Storage), barrio/zona (selección asistida mediante lista de Córdoba Capital y Gran Córdoba) y teléfono opcional.
  * Banner persistente indicando el porcentaje de progreso si el perfil está incompleto.
  * La ubicación registrada servirá para búsquedas por proximidad en la Fase 2.

#### HU-003: Registro de Mascota (Perfil Digital)
* **Como** Tutor,
* **quiero** registrar una o más mascotas con sus datos básicos,
* **para** mantener su información de cuidado centralizada en un único lugar.
* **Criterios de Aceptación:**
  * Campos obligatorios: nombre, especie (perro, gato, otro), raza (con opción "mestizo"), fecha de nacimiento, sexo y peso aproximado.
  * Campos opcionales: color/marcas distintivas, chip/microchip ID.
  * Sin restricciones de límite de mascotas registradas durante el MVP.
  * Foto de la mascota: subida única admitida (Supabase Storage, bucket `pets`).

#### HU-004: Edición y Baja de Mascota
* **Como** Tutor,
* **quiero** editar o eliminar el perfil de mi mascota,
* **para** mantener la información de mis animales siempre al día.
* **Criterios de Aceptación:**
  * Eliminación lógica a nivel de base de datos (`deleted_at timestamp`), nunca física, para preservar el historial.
  * Al procesar la baja, cualquier reserva futura activa pasará automáticamente al estado `cancelled_by_tutor`.

#### HU-005: Registro de Proveedor
* **Como** Proveedor,
* **quiero** registrarme indicando mis servicios, cobertura geográfica y datos comerciales,
* **para** aparecer de forma correcta en las búsquedas que realicen los Tutores.
* **Criterios de Aceptación:**
  * Flujo de entrada diferenciado: selección explícitamente entre "Soy dueño de mascota" o "Ofrezco servicios profesionales".
  * Datos requeridos: nombre del negocio, categoría de servicio (selector múltiple), CUIT/DNI (para validación diferida), descripción (máx. 500 caracteres), radio de cobertura (KM) y punto de ubicación (pin en mapa o dirección).
  * Estado inicial: `pending_approval`. Requiere validación del Administrador para pasar a `active`.
  * No será visible ni aparecerá en módulos de búsqueda hasta poseer el estado `active`.

#### HU-006: Galería Comercial y Horarios del Proveedor
* **Como** Proveedor,
* **quiero** subir fotos de mi espacio de trabajo y definir mis horarios de atención semanales,
* **para** generar confianza y transparencia hacia los potenciales clientes.
* **Criterios de Aceptación:**
  * Soporte para subir hasta un máximo de 6 fotos (Supabase Storage, bucket `providers`).
  * Configuración de horarios: grilla semanal (lunes a domingo) dividida en bloques de 30 minutos, permitiendo marcar días específicos como "cerrado".
  * Estos horarios parametrizados calcularán la disponibilidad real de turnos en la Fase 2.

---

### 4.2 Módulo: Pasaporte Digital de Salud
*Propósito de retención:* Actúa como herramienta de fidelización. El Tutor introduce la información de manera autónoma, convirtiendo a la app en una agenda de salud diaria.

#### HU-007: Control de Vacunación
* **Como** Tutor,
* **quiero** registrar las vacunas aplicadas a mi mascota indicando la fecha y su próximo vencimiento,
* **para** llevar un control riguroso y preventivo de su salud.
* **Criterios de Aceptación:**
  * Campos obligatorios: tipo de vacuna (Antirrábica, Séxtuple, Bordetella, Leishmaniasis, Otra), fecha de aplicación, fecha de próxima dosis, nombre del profesional veterinario (texto libre) y número de lote (opcional).
  * Visualización mediante listado cronológico descendente.
  * Alerta visual (`⚠️ Vence en X días`) cuando la fecha de próxima dosis se ubique a menos de 30 días de la fecha actual.

#### HU-008: Registro de Desparasitaciones
* **Como** Tutor,
* **quiero** registrar las desparasitaciones periódicas especificando el tipo y la frecuencia,
* **para** que la aplicación calcule de manera automática los próximos recordatorios.
* **Criterios de Aceptación:**
  * Selección de tipo de tratamiento: interna, externa o ambas.
  * Selector de frecuencia parametrizado en: 15, 30, 60, 90 o 180 días de intervalo.
  * Cálculo automatizado: `next_due_date = applied_date + frequency_days`.

#### HU-009: Sistema de Alertas de Salud (Notificaciones)
* **Como** Tutor,
* **quiero** recibir alertas automatizadas a través de notificaciones push y correo electrónico,
* **para** evitar olvidos en los cuidados esenciales.
* **Criterios de Aceptación:**
  * Envío programado a los 30 días previos, 7 días previos y el día exacto del vencimiento.
  * Opción de posponer (*snooze* por +7 días) directamente interactuable desde la notificación.
  * Panel de configuración de alertas por categorías.
  * **Implementación técnica:** Supabase Edge Functions combinadas con un cron job diario sobre la tabla `health_records`. Envíos mediante Resend (Email) y Web Push API.

#### HU-010: Historial Clínico y Consultas
* **Como** Tutor,
* **quiero** registrar las visitas periódicas al veterinario adjuntando diagnósticos y tratamientos,
* **para** conservar un registro histórico médico unificado.
* **Criterios de Aceptación:**
  * Formulario: fecha de consulta, profesional, motivo de visita, diagnóstico (área de texto), tratamiento prescrito (área de texto) y fecha opcional de próxima cita.
  * Soporte para adjuntar hasta 3 archivos (PDF o imágenes, límite de 5 MB por archivo).
  * Despliegue visual en una línea de tiempo (*timeline*) cronológica.

#### HU-011: Compartir Pasaporte de Salud Rápido
* **Como** Tutor,
* **quiero** visualizar el expediente completo de mi mascota en una sola pantalla optimizada y poder exportarlo,
* **para** podérselo exhibir o enviar rápidamente a cualquier Proveedor de servicios.
* **Criterios de Aceptación:**
  * Interfaz consolidada: foto, datos descriptivos, última vacuna, alertas de vencimientos, peso histórico, chip ID y marcas.
  * Acción "Compartir": Genera un enlace público de lectura única con un identificador hash seguro (`/passport/{hash}`), sin requerir inicio de sesión del receptor.
  * Validez máxima del enlace de 7 días corridos antes de expirar (parametrizable por el Tutor).

---

### 4.3 Módulo: Mascotas Perdidas y Encontradas
*Propósito de crecimiento:* Herramienta viral enfocada en potenciar el crecimiento orgánico de la comunidad sin costos directos de adquisición de clientes (CAC).

#### HU-012: Reportar Mascota Perdida
* **Como** Tutor afectado,
* **quiero** publicar un reporte de pérdida geolocalizado adjuntando fotos y datos de contacto,
* **para** alertar a la comunidad circundante y agilizar su localización.
* **Criterios de Aceptación:**
  * Vinculación directa con una mascota registrada o creación desde cero de forma anónima.
  * Datos obligatorios: foto, nombre, especie, raza, color, sexo, fecha del suceso, última ubicación (mapa o dirección), comportamiento, celular y recompensa opcional en ARS.
  * Ciclo de vida del reporte: `lost` (activo) → `found` (localizado) → `closed` (finalizado).
  * Al confirmar, el sistema dispara notificaciones push masivas a usuarios en un radio de 5 KM a la redonda.

#### HU-013: Mapa Comunitario de Alertas
* **Como** usuario de la app (con o sin cuenta activa),
* **quiero** explorar un mapa interactivo con reportes de pérdidas cercanos,
* **para** colaborar activamente en la búsqueda en mi zona.
* **Criterios de Aceptación:**
  * Pines interactivos basados en el radio seleccionado por el usuario (5, 10 o 20 KM a la redonda) usando la API de geolocalización nativa.
  * Filtros ágiles por especie del animal y rangos de fechas de desaparición.
  * Tarjeta flotante (*card*) al presionar un pin con botón "Tengo información relevante" (redirige a formulario o abre WhatsApp).
  * Módulo abierto públicamente sin requerir inicio de sesión.

#### HU-014: Reportar Mascota Encontrada en la Vía Pública
* **Como** ciudadano,
* **quiero** notificar el hallazgo de un animal desorientado indicando el lugar y su fotografía,
* **para** ayudar a que sus dueños puedan identificarlo y recuperarlo de inmediato.
* **Criterios de Aceptación:**
  * Formulario simplificado: foto, especie, descripción física breve, punto en el mapa y teléfono de contacto.
  * **Motor de Coincidencias:** Rutina automática que sugiere combinaciones (*matches*) contrastando datos ingresados frente a reportes abiertos en un radio geoespacial de 3 KM (evalúa especie, raza aparente y colores). Envíos automáticos a Tutores con búsquedas similares.

#### HU-015: Cierre de Reporte por Éxito
* **Como** Tutor,
* **quiero** marcar el reporte de mi mascota bajo el estado de "¡Encontrada!",
* **para** finalizar la búsqueda activa y notificar la resolución del caso.
* **Criterios de Aceptación:**
  * Migración del estado a `found`, se archiva en registros históricos y genera una publicación de agradecimiento automática en el feed de la zona.

---

## 5. Fase 2 — Procesos de Marketplace

### 5.1 Búsqueda de Servicios por Proximidad

#### HU-016: Localización Inteligente de Prestadores
* **Como** Tutor,
* **quiero** buscar prestadores profesionales aplicando filtros por tipo de prestación y cercanía,
* **para** contratar alternativas de confianza en las proximidades de mi hogar.
* **Flujo del Proceso Interno:**
  1. El Tutor ingresa a "Buscar Servicios" y selecciona categoría (Peluquería, Paseos, Guardería, Veterinaria, Adiestramiento).
  2. Elige la mascota; el sistema restringe los proveedores compatibles con dicha especie.
  3. Consulta coordenadas actuales de geolocalización (o fallback de dirección de perfil).
  4. Ejecución en base de datos mediante consulta geoespacial PostGIS: `ST_DWithin(provider.location, tutor.location, radius_meters)`.
  5. Ordenamiento por prioridad combinada: distancia física en metros (primario) y promedio de rating del perfil (secundario).
  6. Filtros avanzados: precios máximos, disponibilidad horaria y umbrales de valoración por estrellas.
* **Criterios de Interfaz:**
  * Selector para alternar entre vista de mapa interactivo y listado de tarjetas.
  * Datos de la tarjeta: foto comercial, nombre, categorías, rating (`rating_avg`), tarifa base, distancia calculada y próximo horario disponible.
  * Sello de **"Verificado"** exclusivo para proveedores con validación manual aprobada por administración.

---

### 5.2 Flujo de Reserva y Agenda

#### HU-017: Reserva de Turnos y Confirmación
* **Como** Tutor,
* **quiero** examinar la disponibilidad en la agenda de un Proveedor y reservar un turno,
* **para** garantizar el servicio en el día y horario adecuado

---

## 6. Cierre del Documento

* **Estado:** COMPLETO
* **Versión final:** 1.1
* **Fecha de cierre:** Mayo 2025
* **Alcance cubierto:** Fase 1 (MVP) completa — HU-001 a HU-015 · Fase 2 parcial — HU-016 y HU-017.
* **Este documento es la única fuente de verdad del sistema. Toda implementación debe validarse contra él.**