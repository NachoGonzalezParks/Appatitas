# Gap Analysis — APPATITAS SDD v1.1
**Fecha:** Mayo 2025
**Fuente analizada:** `docs/SDD_MASTER.md` v1.1
**Alcance:** Hallazgos de contradicciones, requisitos faltantes, historias incompletas, decisiones arquitectónicas implícitas y riesgos. No se proponen funcionalidades nuevas.

---

## Índice de Hallazgos

| ID | Categoría | Severidad | HU afectada |
|---|---|---|---|
| [GAP-001](#gap-001) | Historia incompleta | Crítica | HU-017 |
| [GAP-002](#gap-002) | Requisito faltante | Crítica | HU-005, HU-016 |
| [GAP-003](#gap-003) | Requisito faltante | Crítica | Flujo de valor §2.1 |
| [GAP-004](#gap-004) | Decisión arquitectónica implícita | ✅ Resuelto (RFC-002) | HU-001, HU-005 |
| [GAP-005](#gap-005) | Requisito faltante | ✅ Resuelto (RFC-003) | Admin (todos) |
| [GAP-006](#gap-006) | Contradicción | Alta | HU-004 |
| [GAP-007](#gap-007) | Historia incompleta | Alta | HU-017 |
| [GAP-008](#gap-008) | Decisión arquitectónica implícita | Alta | HU-016 |
| [GAP-009](#gap-009) | Requisito faltante | Alta | HU-011 |
| [GAP-010](#gap-010) | Requisito faltante | Media | HU-009 |
| [GAP-011](#gap-011) | Decisión arquitectónica implícita | Media | HU-012, HU-013 |
| [GAP-012](#gap-012) | Requisito faltante | Media | HU-014 |
| [GAP-013](#gap-013) | Contradicción | Media | HU-005 vs HU-016 |
| [GAP-014](#gap-014) | Decisión arquitectónica implícita | Media | HU-001, HU-005 |
| [GAP-015](#gap-015) | Requisito faltante | Media | HU-015 |
| [GAP-016](#gap-016) | Riesgo | Media | HU-006, HU-017 |
| [GAP-017](#gap-017) | Requisito faltante | Baja | HU-007 |
| [GAP-018](#gap-018) | Decisión arquitectónica implícita | Baja | HU-013 |
| [GAP-019](#gap-019) | Riesgo | Baja | HU-012 |

---

## Hallazgos Detallados

---

### GAP-001
**Categoría:** Historia incompleta
**Severidad:** Crítica
**HU afectada:** HU-017

**Descripción:**
HU-017 "Reserva de Turnos y Confirmación" está declarada pero no tiene ningún criterio de aceptación. La historia termina en la línea `para garantizar el servicio en el día y horario adecuado` sin desarrollar flujo, estados de reserva, confirmación del Proveedor, ni integración con el sistema de pagos.

**Impacto:**
Es imposible implementar el módulo de reservas sin criterios. Es el núcleo transaccional de Fase 2.

**Preguntas abiertas:**
- ¿El Proveedor debe confirmar manualmente la reserva o es automática si hay disponibilidad?
- ¿Qué estados tiene una reserva? (el SDD menciona `cancelled_by_tutor` en HU-004 pero no define el ciclo completo)
- ¿Cuánto tiempo tiene el Proveedor para confirmar antes de que la reserva expire?
- ¿El pago se procesa al reservar o al confirmar?

---

### GAP-002
**Categoría:** Requisito faltante
**Severidad:** Crítica
**HU afectada:** HU-005, HU-016 y flujo de valor completo

**Descripción:**
El porcentaje de comisión que retiene Appatitas sobre cada transacción no está documentado en ningún lugar del SDD. El flujo de valor (§2.1) describe el mecanismo pero nunca define el valor de la comisión.

**Impacto:**
- El esquema de la tabla `payments` no puede diseñarse sin el campo `commission_rate`.
- No es posible configurar la cuenta de Mercado Pago Marketplace sin el porcentaje definido.
- Afecta el diseño del payout al Proveedor.

---

### GAP-003
**Categoría:** Requisito faltante
**Severidad:** Crítica
**HU afectada:** Flujo de valor §2.1, §5.2

**Descripción:**
El mecanismo de verificación de servicio realizado no está especificado. El flujo de valor dice: *"Se libera el saldo restante al Proveedor una vez que el servicio es verificado como realizado"*, pero ninguna historia de usuario describe cómo ocurre esa verificación.

**Impacto:**
Sin definir este paso, el dinero retenido por Mercado Pago no tiene disparador de liberación. Es un vacío funcional crítico para la operación del marketplace.

**Preguntas abiertas:**
- ¿El Tutor confirma explícitamente que el servicio fue realizado?
- ¿Hay un plazo automático de liberación si el Tutor no confirma?
- ¿El Admin puede liberar manualmente?
- ¿Existe un flujo de disputa/reclamo?

---

### GAP-004
**Categoría:** Decisión arquitectónica implícita
**Severidad:** Alta
**Estado:** ✅ **RESUELTO (2026-06-25) por RFC-002.** Un usuario puede tener varios roles. Se modela con la tabla `user_roles` (1:N) y se retira `users.role`. Ver `docs/rfcs/RFC-002-roles-multiples-por-usuario.md`.
**HU afectada:** HU-001, HU-005

**Descripción:**
El SDD define un único campo `role` en la tabla `users` con valor `'tutor'`. Sin embargo, el sistema requiere al menos tres roles: `tutor`, `provider` y `admin`. No se documenta si una misma persona puede tener ambos roles (Tutor que también es Proveedor), ni cómo se maneja ese caso.

**Impacto:**
- El esquema de `users` asume un único rol por cuenta.
- HU-005 muestra un flujo de selección en el onboarding ("Soy dueño" / "Ofrezco servicios") que sugiere roles mutuamente excluyentes, pero no lo confirma.
- Si un Proveedor quiere también registrar su propia mascota, no hay camino documentado.

---

### GAP-005
**Categoría:** Requisito faltante
**Severidad:** Alta
**Estado:** ✅ **RESUELTO (2026-06-25) por RFC-003.** El Admin se incorpora como actor de primera clase con HU-018 a HU-021 (acceso/permisos, panel y monitoreo de transacciones, aprobación de Proveedores, moderación de reportes) y auditoría inmutable en `admin_audit_log`. Ver `docs/rfcs/RFC-003-actor-administrador.md` y `docs/SDD_MASTER.md` §6.
**HU afectada:** Actor Admin (todos los módulos)

**Descripción:**
El Admin está listado como actor en la Matriz de Actores (§2.2) y es mencionado en HU-005 como responsable de aprobar Proveedores. Sin embargo, no existe ninguna historia de usuario para el rol Admin. No hay pantallas, flujos, permisos ni capacidades documentadas para este actor.

**Impacto:**
- Sin panel de Admin, los Proveedores no pueden pasar de `pending_approval` a `active`, bloqueando la operación completa del marketplace.
- No hay forma documentada de moderar reportes de mascotas perdidas, gestionar disputas ni monitorear transacciones.

---

### GAP-006
**Categoría:** Contradicción
**Severidad:** Alta
**HU afectada:** HU-004

**Descripción:**
HU-004 especifica que al dar de baja una mascota, las reservas futuras activas pasan a `cancelled_by_tutor`. Sin embargo, el sistema de reservas pertenece a Fase 2, mientras que HU-004 es Fase 1. Esto crea una dependencia de Fase 2 embebida en una historia de Fase 1.

**Impacto:**
- Implementar HU-004 en Fase 1 requeriría que la tabla `bookings` y sus estados existan, aunque las reservas no sean funcionales todavía.
- Si `bookings` no existe en Fase 1, el criterio de aceptación de HU-004 no puede cumplirse.

**Opciones documentables:**
- Definir si el criterio de cancelación de reservas en HU-004 aplica solo desde Fase 2 en adelante.
- O crear la tabla `bookings` en Fase 1 sin exponerla al usuario.

---

### GAP-007
**Categoría:** Historia incompleta
**Severidad:** Alta
**HU afectada:** HU-017

**Descripción:**
El ciclo de vida completo de una reserva no está definido. HU-004 introduce el estado `cancelled_by_tutor` como referencia pero el SDD nunca documenta el conjunto de estados válidos ni las transiciones permitidas entre ellos.

**Estados mencionados dispersamente en el SDD:**
- `cancelled_by_tutor` (HU-004)
- Ningún otro estado nombrado explícitamente

**Estados que el negocio necesitaría pero no están documentados:**
`pending` / `confirmed` / `in_progress` / `completed` / `cancelled_by_provider` / `disputed` — ninguno aparece en el SDD.

---

### GAP-008
**Categoría:** Decisión arquitectónica implícita
**Severidad:** Alta
**HU afectada:** HU-016

**Descripción:**
HU-016 usa `rating_avg` como criterio de ordenamiento secundario en los resultados de búsqueda, pero no existe ninguna historia de usuario que describa el sistema de valoraciones (ratings). No se documenta quién puede calificar, cuándo, con qué escala ni dónde se almacenan.

**Impacto:**
- La tabla o campo que contiene `rating_avg` no tiene origen definido.
- No hay criterios para cuándo se habilita calificar (¿solo tras servicio completado?).
- La tarjeta de Proveedor en HU-016 muestra `rating_avg` pero sin fuente de datos documentada.

---

### GAP-009
**Categoría:** Requisito faltante
**Severidad:** Alta
**HU afectada:** HU-011

**Descripción:**
HU-011 incluye "peso histórico" en la interfaz del pasaporte de salud. Sin embargo, ninguna historia de usuario define cómo se registra el peso de la mascota a lo largo del tiempo. HU-003 solo captura "peso aproximado" como campo estático inicial. No existe una HU de registro periódico de peso.

**Impacto:**
- El "peso histórico" en el pasaporte no tiene fuente de datos documentada.
- La tabla que almacenaría registros de peso no está definida.

---

### GAP-010
**Categoría:** Requisito faltante
**Severidad:** Media
**HU afectada:** HU-009

**Descripción:**
HU-009 describe un "panel de configuración de alertas por categorías" pero no especifica cuáles son esas categorías, qué puede activar o desactivar el Tutor, ni cuál es el estado por defecto (opt-in vs opt-out).

**Impacto:**
No se puede implementar el panel sin saber qué controles expone. Tampoco se puede definir el esquema de preferencias en base de datos.

---

### GAP-011
**Categoría:** Decisión arquitectónica implícita
**Severidad:** Media
**HU afectada:** HU-012, HU-013

**Descripción:**
HU-012 dispara notificaciones push masivas a usuarios en radio de 5 KM, y HU-013 es accesible sin inicio de sesión. No se documenta:
- Cómo se obtienen los tokens push de usuarios anónimos (sin cuenta).
- Si los usuarios no registrados pueden recibir notificaciones push.
- Qué sucede con usuarios que no otorgaron permiso de notificaciones.

**Impacto:**
La estrategia de notificación de HU-012 asume implícitamente que todos los usuarios en el radio tienen tokens push registrados, lo cual puede no ser cierto para usuarios anónimos ni para aquellos que denegaron permisos.

---

### GAP-012
**Categoría:** Requisito faltante
**Severidad:** Media
**HU afectada:** HU-014

**Descripción:**
El motor de coincidencias de HU-014 no especifica:
- Umbral mínimo de similitud para considerar un match válido.
- Qué sucede con los falsos positivos (matches incorrectos).
- Si el ciudadano que reporta es notificado del resultado del match.
- Cómo se evalúa "raza aparente" de forma automatizada a partir de una foto y descripción de texto libre.

**Impacto:**
El algoritmo de matching es técnicamente indeterminado. "Raza aparente" en particular implica una decisión de implementación mayor (reglas manuales, clasificador de imágenes, etc.) que no está documentada.

---

### GAP-013
**Categoría:** Contradicción
**Severidad:** Media
**HU afectada:** HU-005 vs HU-016

**Descripción:**
HU-005 permite a un Proveedor definir su cobertura como "radio de cobertura (KM)" (campo escalar). La v1.1 del SDD introduce la tabla `service_areas` para "coberturas granulares". HU-016 usa `ST_DWithin` con `radius_meters`.

No queda claro si la búsqueda filtra por:
- El radio definido por el Proveedor en su perfil (columna en `providers`), o
- Las áreas registradas en `service_areas`, o
- Ambas en combinación.

**Impacto:**
La consulta PostGIS de HU-016 tiene dos implementaciones posibles con resultados diferentes. El esquema de base de datos depende de cuál sea la correcta.

---

### GAP-014
**Categoría:** Decisión arquitectónica implícita
**Severidad:** Media
**HU afectada:** HU-001, HU-005

**Descripción:**
El SDD no documenta la política de Row Level Security (RLS) de Supabase. Siendo que la plataforma tiene datos sensibles (registros de salud, datos de mascotas, pagos, CUIT/DNI), la ausencia de RLS documentada es una decisión implícita de seguridad con consecuencias directas sobre el esquema y las Edge Functions.

**Impacto:**
Sin RLS definida, no se puede garantizar que un Tutor no acceda a datos de otro Tutor, ni que un Proveedor vea información que no le corresponde.

---

### GAP-015
**Categoría:** Requisito faltante
**Severidad:** Media
**HU afectada:** HU-015

**Descripción:**
HU-015 menciona que al cerrar un reporte con éxito "genera una publicación de agradecimiento automática en el feed de la zona". No existe ninguna otra historia de usuario que defina el concepto de "feed", su alcance geográfico, su contenido ni su acceso (autenticado o público).

**Impacto:**
La publicación automática de HU-015 referencia un componente ("feed") que no está definido en ningún lugar del SDD.

---

### GAP-016
**Categoría:** Riesgo
**Severidad:** Media
**HU afectada:** HU-006, HU-017

**Descripción:**
HU-006 define los horarios del Proveedor como una grilla semanal con bloques de 30 minutos. HU-017 (sin criterios) implica que esos horarios se usarán para calcular disponibilidad real. No se documenta cómo se manejan:
- Excepciones a la grilla semanal (feriados, vacaciones, días especiales).
- Cancelaciones del Proveedor que liberan slots.
- Concurrencia: dos Tutores reservando el mismo slot simultáneamente.

**Impacto:**
Un sistema de turnos sin manejo de excepciones ni control de concurrencia genera doble-booking y datos de disponibilidad incorrectos.

---

### GAP-017
**Categoría:** Requisito faltante
**Severidad:** Baja
**HU afectada:** HU-007

**Descripción:**
HU-007 define las vacunas como un listado fijo: Antirrábica, Séxtuple, Bordetella, Leishmaniasis, Otra. No documenta si este catálogo es administrable (por Admin) o es un enum estático en base de datos. Tampoco especifica comportamiento para la opción "Otra" (¿se registra el texto libre como nombre de vacuna?).

**Impacto:**
Decisión de esquema pendiente: enum de base de datos vs tabla de catálogo administrable.

---

### GAP-018
**Categoría:** Decisión arquitectónica implícita
**Severidad:** Baja
**HU afectada:** HU-013

**Descripción:**
HU-013 es accesible públicamente sin inicio de sesión y requiere geolocalización nativa del dispositivo. No se documenta el comportamiento de fallback cuando el usuario deniega el permiso de geolocalización en el navegador.

**Impacto:**
Sin fallback definido, la experiencia del usuario que deniega geolocalización es indeterminada (pantalla en blanco, error, mapa vacío).

---

### GAP-019
**Categoría:** Riesgo
**Severidad:** Baja
**HU afectada:** HU-012

**Descripción:**
El campo "recompensa opcional en ARS" de HU-012 es de texto libre sin validación ni procesamiento definido. No se documenta si Appatitas interviene en la gestión de la recompensa (escrow, verificación) o si es simplemente informativo.

**Impacto:**
Si es solo informativo, no hay riesgo técnico. Si se espera que la plataforma gestione el pago de la recompensa, requiere un flujo de pago no documentado.

---

## Resumen por Severidad

| Severidad | Cantidad | IDs |
|---|---|---|
| **Crítica** | 3 | GAP-001, GAP-002, GAP-003 |
| **Alta** | 6 | GAP-004, GAP-005, GAP-006, GAP-007, GAP-008, GAP-009 |
| **Media** | 7 | GAP-010, GAP-011, GAP-012, GAP-013, GAP-014, GAP-015, GAP-016 |
| **Baja** | 3 | GAP-017, GAP-018, GAP-019 |
| **Total** | 19 | — |

## Orden de Resolución Recomendado

Los siguientes GAPs deben resolverse **antes de iniciar cualquier implementación**, ya que afectan decisiones de esquema de base de datos o flujos completos:

1. **GAP-001** — Completar criterios de HU-017 (reservas).
2. **GAP-002** — Definir porcentaje de comisión.
3. **GAP-003** — Especificar mecanismo de verificación de servicio y liberación de fondos.
4. ~~**GAP-005** — Documentar historias de usuario del rol Admin.~~ ✅ Resuelto por RFC-003.
5. **GAP-007** — Definir el ciclo de vida completo de estados de reserva.
6. **GAP-006** — Resolver la dependencia de Fase 2 embebida en HU-004.
7. ~~**GAP-004** — Aclarar política de roles únicos vs múltiples por usuario.~~ ✅ Resuelto por RFC-002.
8. **GAP-008** — Documentar el sistema de valoraciones (ratings).

> **Estado de resolución (2026-06-25):** GAP-004 y GAP-005 resueltos por RFC-002 y RFC-003 respectivamente. Quedan pendientes los gaps críticos GAP-001, GAP-002, GAP-003 y GAP-007 (Sprint 5).
