# Reglas de Negocio — APPATITAS
**Versión:** 1.0
**Fuente:** `docs/SDD_MASTER.md` v1.1
**Fecha:** Mayo 2025

Toda regla listada aquí deriva directamente del SDD_MASTER. Ninguna regla fue inferida ni inventada.

---

## Índice

| ID | Módulo | Descripción breve |
|---|---|---|
| [RN-001](#rn-001) | Modelo de negocio | Comisión solo sobre servicio verificado |
| [RN-002](#rn-002) | Proveedores | Aprobación obligatoria antes de visibilidad |
| [RN-003](#rn-003) | Mascotas | Eliminación lógica con cascada de reservas |
| [RN-004](#rn-004) | Auth | Verificación de email obligatoria |
| [RN-005](#rn-005) | Auth | Unicidad de email en el sistema |
| [RN-006](#rn-006) | Salud | Alertas escalonadas en tres momentos |
| [RN-007](#rn-007) | Salud | Snooze de alerta por +7 días |
| [RN-008](#rn-008) | Pasaporte | Enlace público expira en 7 días |
| [RN-009](#rn-009) | Pasaporte | Acceso sin sesión al enlace de pasaporte |
| [RN-010](#rn-010) | Desparasitación | Cálculo de próxima dosis |
| [RN-011](#rn-011) | Desparasitación | Frecuencias válidas |
| [RN-012](#rn-012) | Mascotas perdidas | Notificación push en radio de 5 KM |
| [RN-013](#rn-013) | Mascotas perdidas | Ciclo de vida del reporte de pérdida |
| [RN-014](#rn-014) | Mascotas perdidas | Motor de coincidencias en radio de 3 KM |
| [RN-015](#rn-015) | Mascotas perdidas | Mapa público sin sesión |
| [RN-016](#rn-016) | Mascotas | Sin límite de mascotas por Tutor en Fase 1 |
| [RN-017](#rn-017) | Proveedores | Galería máximo 6 fotos |
| [RN-018](#rn-018) | Proveedores | Horario en bloques de 30 minutos |
| [RN-019](#rn-019) | Búsqueda | Filtro de proveedores por especie de mascota |
| [RN-020](#rn-020) | Búsqueda | Ordenamiento de resultados |
| [RN-021](#rn-021) | Búsqueda | Sello "Verificado" |
| [RN-022](#rn-022) | Vacunación | Alerta visual a menos de 30 días |
| [RN-023](#rn-023) | Historial clínico | Límite de adjuntos por consulta |
| [RN-024](#rn-024) | Mascotas | Foto única por mascota |
| [RN-025](#rn-025) | Proveedores | Estado inicial pending_approval |
| [RN-026](#rn-026) | Mascotas perdidas | Publicación automática al cerrar reporte |

---

## Reglas Detalladas

---

### RN-001
**Módulo:** Modelo de negocio
**HU de origen:** §2.1 Flujo de Valor
**Descripción:**
Appatitas retiene su comisión **únicamente** sobre transacciones completadas con éxito. El saldo restante se libera al Proveedor una vez que el servicio es verificado como realizado. No se retiene comisión sobre reservas canceladas, en progreso o pendientes.

---

### RN-002
**Módulo:** Proveedores
**HU de origen:** HU-005
**Descripción:**
Todo Proveedor recién registrado inicia con el estado `pending_approval`. Permanece invisible en todos los módulos de búsqueda hasta que un Administrador lo pase manualmente al estado `active`. Un Proveedor en `pending_approval` no puede ser encontrado ni contratado por ningún Tutor.

---

### RN-003
**Módulo:** Mascotas
**HU de origen:** HU-004
**Descripción:**
Las mascotas nunca se eliminan físicamente de la base de datos. La baja se registra mediante el campo `deleted_at` (eliminación lógica). Al procesar la baja de una mascota, todas las reservas futuras activas vinculadas a ella pasan automáticamente al estado `cancelled_by_tutor`.

---

### RN-004
**Módulo:** Auth
**HU de origen:** HU-001
**Descripción:**
La verificación del email es obligatoria. El acceso completo a la plataforma queda bloqueado hasta que el usuario complete el flujo de verificación mediante el enlace enviado a su correo electrónico.

---

### RN-005
**Módulo:** Auth
**HU de origen:** HU-001
**Descripción:**
El email debe ser único en todo el sistema. El registro es rechazado si el email ya existe en la tabla `users`, independientemente del rol.

---

### RN-006
**Módulo:** Pasaporte de Salud — Alertas
**HU de origen:** HU-009
**Descripción:**
Las alertas de salud (vacunas y desparasitaciones) se envían en tres momentos fijos:
- 30 días antes del vencimiento.
- 7 días antes del vencimiento.
- El día exacto del vencimiento.

Los canales de envío son notificación push (Web Push API) y correo electrónico (Resend).

---

### RN-007
**Módulo:** Pasaporte de Salud — Alertas
**HU de origen:** HU-009
**Descripción:**
El Tutor puede posponer (*snooze*) una alerta directamente desde la notificación. El snooze extiende el próximo aviso en exactamente **+7 días** desde el momento de la acción.

---

### RN-008
**Módulo:** Pasaporte de Salud — Compartir
**HU de origen:** HU-011
**Descripción:**
El enlace público generado al compartir el pasaporte de salud (`/passport/{hash}`) tiene una validez máxima de **7 días corridos**. La duración es parametrizable por el propio Tutor dentro de ese límite. Al expirar, el enlace deja de funcionar.

---

### RN-009
**Módulo:** Pasaporte de Salud — Compartir
**HU de origen:** HU-011
**Descripción:**
El receptor del enlace de pasaporte puede visualizar el contenido sin necesidad de tener cuenta ni iniciar sesión en la plataforma. El enlace es de solo lectura.

---

### RN-010
**Módulo:** Desparasitaciones
**HU de origen:** HU-008
**Descripción:**
La fecha de próxima desparasitación se calcula mediante la fórmula:
```
next_due_date = applied_date + frequency_days
```
El cálculo es automático al registrar el tratamiento.

---

### RN-011
**Módulo:** Desparasitaciones
**HU de origen:** HU-008
**Descripción:**
Los únicos valores válidos para `frequency_days` son: **15, 30, 60, 90 y 180 días**. No se admiten frecuencias personalizadas fuera de este conjunto.

---

### RN-012
**Módulo:** Mascotas Perdidas
**HU de origen:** HU-012
**Descripción:**
Al publicar un reporte de mascota perdida, el sistema dispara automáticamente notificaciones push masivas a todos los usuarios de la plataforma ubicados en un radio de **5 KM** alrededor de la última ubicación registrada de la mascota.

---

### RN-013
**Módulo:** Mascotas Perdidas
**HU de origen:** HU-012, HU-015
**Descripción:**
El ciclo de vida de un reporte de pérdida sigue la siguiente secuencia de estados:
```
lost (activo) → found (localizado) → closed (finalizado)
```
Solo el Tutor propietario del reporte puede cambiar el estado a `found` (HU-015). El estado `closed` representa el archivado definitivo del caso.

---

### RN-014
**Módulo:** Mascotas Perdidas — Motor de Coincidencias
**HU de origen:** HU-014
**Descripción:**
Al registrar una mascota encontrada en la vía pública, el sistema ejecuta automáticamente una rutina de matching contra los reportes de pérdida abiertos (`lost`) en un radio geoespacial de **3 KM**. Los criterios de evaluación son: especie, raza aparente y colores. Los Tutores con búsquedas compatibles reciben notificaciones automáticas.

---

### RN-015
**Módulo:** Mascotas Perdidas — Mapa
**HU de origen:** HU-013
**Descripción:**
El mapa comunitario de alertas (HU-013) es de acceso público. No requiere inicio de sesión para ser visualizado ni para interactuar con los pines de mascotas perdidas.

---

### RN-016
**Módulo:** Mascotas
**HU de origen:** HU-003
**Descripción:**
Durante la Fase 1 (MVP) no existe ningún límite en la cantidad de mascotas que un Tutor puede registrar bajo su cuenta.

---

### RN-017
**Módulo:** Proveedores — Galería
**HU de origen:** HU-006
**Descripción:**
Un Proveedor puede subir hasta un máximo de **6 fotos** en su galería comercial. Las fotos se almacenan en Supabase Storage, bucket `providers`.

---

### RN-018
**Módulo:** Proveedores — Horarios
**HU de origen:** HU-006
**Descripción:**
La grilla de horarios del Proveedor se configura con bloques de **30 minutos**, para cada día de la semana (lunes a domingo). Cada día puede marcarse individualmente como "cerrado". Estos horarios son la fuente de cálculo de disponibilidad real en Fase 2.

---

### RN-019
**Módulo:** Búsqueda de Servicios
**HU de origen:** HU-016
**Descripción:**
Al buscar servicios, el sistema restringe los resultados a proveedores que sean compatibles con la especie de la mascota seleccionada por el Tutor. Proveedores incompatibles con la especie no aparecen en los resultados.

---

### RN-020
**Módulo:** Búsqueda de Servicios
**HU de origen:** HU-016
**Descripción:**
Los resultados de búsqueda se ordenan con la siguiente prioridad combinada:
1. **Primario:** Distancia física en metros (menor distancia primero).
2. **Secundario:** Promedio de rating del perfil (`rating_avg`, mayor rating primero).

---

### RN-021
**Módulo:** Búsqueda de Servicios
**HU de origen:** HU-016
**Descripción:**
El sello **"Verificado"** se muestra exclusivamente en perfiles de Proveedores que hayan recibido validación manual aprobada por el equipo Administrador. No es automático ni autoasignable.

---

### RN-022
**Módulo:** Vacunación
**HU de origen:** HU-007
**Descripción:**
Se muestra una alerta visual en el registro de vacuna (`⚠️ Vence en X días`) cuando la fecha de próxima dosis se encuentre a **menos de 30 días** de la fecha actual del sistema.

---

### RN-023
**Módulo:** Historial Clínico
**HU de origen:** HU-010
**Descripción:**
Cada registro de consulta veterinaria admite hasta **3 archivos adjuntos**. Los formatos permitidos son PDF e imágenes. El límite de tamaño por archivo es de **5 MB**.

---

### RN-024
**Módulo:** Mascotas
**HU de origen:** HU-003
**Descripción:**
Cada mascota admite una única foto de perfil. No se permiten galerías múltiples por mascota. La foto se almacena en Supabase Storage, bucket `pets`.

---

### RN-025
**Módulo:** Proveedores
**HU de origen:** HU-005
**Descripción:**
El estado inicial de todo Proveedor recién registrado es `pending_approval`. Este estado es asignado automáticamente por el sistema al completar el formulario de registro. No es configurable por el propio Proveedor.

---

### RN-026
**Módulo:** Mascotas Perdidas
**HU de origen:** HU-015
**Descripción:**
Al cerrar un reporte de pérdida con éxito (estado `found`), el sistema genera automáticamente una publicación de agradecimiento en el feed de la zona correspondiente.

---

## Notas de Integridad

- Las reglas RN-001 y RN-003 tienen dependencias con el módulo de Pagos (Fase 2), cuya implementación no está completamente documentada en el SDD v1.1. Ver `docs/GAP_ANALYSIS.md` — GAP-003.
- La regla RN-014 (motor de coincidencias) tiene el algoritmo de evaluación sin especificar. Ver `docs/GAP_ANALYSIS.md` — GAP-012.
- La regla RN-026 referencia un "feed de zona" cuyo diseño no está documentado en el SDD. Ver `docs/GAP_ANALYSIS.md` — GAP-015.
