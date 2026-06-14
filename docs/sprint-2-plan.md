# Sprint 2 — Pasaporte Digital de Salud
**Fuente:** `docs/technical-backlog.md` · `docs/SDD_MASTER.md` v1.1
**Duración estimada:** 2 semanas
**Bounded Context:** BC-03 (Pasaporte Digital de Salud)
**HU cubiertas:** HU-007 · HU-008 · HU-009 · HU-010 · HU-011

Es el módulo de retención central de Fase 1. Sin él, la app no tiene motivo de uso diario para el Tutor. La calidad de implementación de este sprint determina directamente la métrica de MAU del roadmap.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 2

| Tarea | Desbloquea directamente |
|---|---|
| **S2-01** Vacunas | S2-04 (cron evalúa `health_records`), S2-05 (pasaporte los muestra) |
| **S2-02** Desparasitaciones | S2-04, S2-05 |
| **S2-03** Historial clínico | S2-05 |
| **S2-04** Alertas de salud | S3-01 (reutiliza infraestructura push) |
| **S2-05** Pasaporte compartido | Independiente, cierra BC-03 |

### 1.2 Dependencias previas requeridas

- S1-03 completo: tabla `pets` con registros reales. Sin mascotas, no hay a qué asociar registros de salud.
- S0-07 completo: Resend operativo. Sin él, el canal email de HU-009 no funciona.
- Bucket `health-records` en Storage con política privada (adjuntos clínicos de HU-010).
- Tabla `health_records` con todas sus columnas.
- Tabla `passport_shares` con columnas `hash` y `expires_at`.

### 1.3 Reglas de negocio activas en este sprint

| RN | Descripción | Tarea |
|---|---|---|
| RN-006 | Alertas a 30/7/0 días del vencimiento | S2-04 |
| RN-007 | Snooze de alerta +7 días | S2-04 |
| RN-008 | Enlace de pasaporte expira en máx. 7 días | S2-05 |
| RN-009 | Acceso al pasaporte sin sesión requerida | S2-05 |
| RN-010 | next_due_date = applied_date + frequency_days | S2-02 |
| RN-011 | Frecuencias válidas: 15, 30, 60, 90, 180 días | S2-02 |
| RN-022 | Alerta visual a menos de 30 días del vencimiento | S2-01 |
| RN-023 | Máx. 3 adjuntos, 5 MB c/u, PDF o imagen | S2-03 |

### 1.4 Gaps activos en este sprint

| GAP | Descripción | Decisión provisional |
|---|---|---|
| GAP-009 | "Peso histórico" en pasaporte sin tabla de origen | HU-011 muestra `pets.weight_kg` (estático). Mostrar como "Último peso registrado". |
| GAP-010 | Categorías del panel de alertas sin definir | Panel con toggle por tipo: `vaccination` y `deworming`. Consultar al área comercial si hay más. |

### 1.5 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Web Push en iOS requiere A2HS | Alta | Alto — usuarios iPhone sin push | Email es el canal de respaldo obligatorio. Solicitar permiso push con UX explicativa. |
| Token push no registrado antes del cron | Media | Medio — notificación no llega | El cron no falla si no hay token; simplemente no envía push. Solo envía email. |
| Edge Function timeout con muchos registros | Baja | Medio — alertas no se envían | Procesar en batches de 100 registros por ejecución. |
| Hash de pasaporte predecible | Baja | Alto — exposición de datos de salud | Usar `pgcrypto.gen_random_bytes(32)` codificado en base64url. No usar UUID simple. |

---

## 2. Diseño Técnico

### 2.1 S2-01 — Registro de vacunas (HU-007)

**INSERT en `health_records`:**

```
{
  pet_id:       seleccionado por el Tutor,
  type:         'vaccination',
  applied_date: form.applied_date,
  next_due_date: form.next_due_date,     -- ingresado manualmente por el Tutor
  vaccine_type: form.vaccine_type,       -- enum: Antirrábica|Séxtuple|Bordetella|Leishmaniasis|Otra
  vet_name:     form.vet_name,
  batch_number: form.batch_number        -- nullable
}
```

**Alerta visual (RN-022):**
```
dias_restantes = next_due_date - today
IF dias_restantes < 30 → mostrar "⚠️ Vence en {dias_restantes} días"
IF dias_restantes <= 0 → mostrar "⚠️ VENCIDA"
```

**Listado:** SELECT ordenado por `applied_date DESC`.

---

### 2.2 S2-02 — Registro de desparasitaciones (HU-008)

**Cálculo automático (RN-010):**
```
next_due_date = applied_date + frequency_days
```
El cálculo ocurre en el cliente al seleccionar la fecha de aplicación y la frecuencia. Se muestra en tiempo real antes de guardar.

**Valores válidos de `frequency_days` (RN-011):** 15 · 30 · 60 · 90 · 180. Selector fijo, sin input libre.

**INSERT en `health_records`:**
```
{
  pet_id:          seleccionado,
  type:            'deworming',
  applied_date:    form.applied_date,
  next_due_date:   applied_date + frequency_days,
  frequency_days:  form.frequency_days,
  deworming_type:  form.deworming_type   -- 'interna'|'externa'|'ambas'
}
```

---

### 2.3 S2-03 — Historial clínico (HU-010)

**INSERT en `health_records`:**
```
{
  pet_id:       seleccionado,
  type:         'clinical_visit',
  applied_date: form.visit_date,
  next_due_date: form.next_appointment,  -- nullable
  vet_name:     form.vet_name,
  visit_reason: form.visit_reason,
  diagnosis:    form.diagnosis,
  treatment:    form.treatment
}
```

**Adjuntos (RN-023):**
- Validación cliente: máx. 3 archivos, tipos MIME: `application/pdf`, `image/*`, tamaño ≤ 5 MB c/u.
- Ruta en Storage: `health-records/{pet_id}/{record_id}/{filename}`
- Los adjuntos se suben después del INSERT del registro. Si el upload falla, el registro clínico existe sin adjuntos (no rollback).

**Vista timeline:** SELECT `type = 'clinical_visit'` ORDER BY `applied_date DESC`. Renderizado como línea de tiempo vertical con fecha y motivo como puntos de ancla.

---

### 2.4 S2-04 — Sistema de alertas de salud (HU-009)

**Edge Function — `health-alerts-cron`:**

```
Disparador: cron '0 9 * * *'  (9:00 AM hora Argentina)

Lógica:
  fechas_objetivo = [today, today+7, today+30]

  registros = SELECT hr.*, p.user_id, u.email, u.push_token
              FROM health_records hr
              JOIN pets p ON p.id = hr.pet_id
              JOIN users u ON u.id = p.user_id
              WHERE hr.next_due_date = ANY(fechas_objetivo)
                AND p.deleted_at IS NULL

  Para cada registro:
    → Enviar email vía Resend (siempre)
    → Si u.push_token IS NOT NULL → enviar Web Push

Payload de push:
  {
    title: "Recordatorio de salud — {pet.name}",
    body:  "{tipo} vence {en X días / hoy}",
    data:  { pet_id, record_id, action: 'snooze' }
  }
```

**Snooze (RN-007):**
```
Usuario toca "Posponer 7 días" en la notificación o en la app
  → UPDATE health_records
     SET next_due_date = next_due_date + INTERVAL '7 days'
     WHERE id = {record_id}
```

**Registro de tokens push:**
- Tabla implícita: columna `push_token TEXT` en `users` (actualizar migración de Sprint 0 si no existe).
- Al cargar la PWA: `Notification.requestPermission()` → si 'granted' → `registration.pushManager.subscribe(VAPID)` → UPDATE `users.push_token`.

**Panel de configuración (GAP-010):**
Implementar como columna `alert_preferences JSONB` en `users`:
```json
{ "vaccination": true, "deworming": true }
```
El cron filtra según estas preferencias antes de enviar.

---

### 2.5 S2-05 — Pasaporte compartido (HU-011)

**Generación del enlace:**
```
hash = base64url(pgcrypto.gen_random_bytes(32))

INSERT passport_shares:
  { pet_id, hash, expires_at = now() + {duracion_dias} * INTERVAL '1 day' }
  -- duracion_dias: 1-7, seleccionado por el Tutor. Default: 7 (RN-008)

URL resultante: /passport/{hash}
```

**Ruta pública `/passport/{hash}` (RN-009):**
```
SELECT ps.*, p.*, hr.*
FROM passport_shares ps
JOIN pets p ON p.id = ps.pet_id
LEFT JOIN health_records hr ON hr.pet_id = p.id
WHERE ps.hash = {hash}
  AND ps.expires_at > now()
  AND p.deleted_at IS NULL

Si no hay resultado → pantalla "Este enlace ha expirado o no existe"
```

**Contenido del pasaporte:**
- Foto, nombre, especie, raza, fecha de nacimiento, sexo.
- Peso (campo `weight_kg` estático — GAP-009).
- Chip/microchip ID.
- Última vacuna aplicada (by `applied_date DESC LIMIT 1 WHERE type='vaccination'`).
- Próximos vencimientos con alerta visual.
- Marcas/color.

**Política RLS para `passport_shares`:** acceso de lectura permitido para `anon` role solo si `expires_at > now()`.

---

## 3. Archivos nuevos en este sprint

```
src/
├── bc03-health/
│   ├── pages/
│   │   ├── HealthDashboardPage.vue     — Hub: lista de registros por mascota
│   │   ├── VaccinationFormPage.vue     — HU-007
│   │   ├── DewormingFormPage.vue       — HU-008
│   │   ├── ClinicalVisitFormPage.vue   — HU-010
│   │   ├── AlertsSettingsPage.vue      — HU-009: panel de configuración
│   │   └── PassportPage.vue            — HU-011: vista autenticada + pública /passport/:hash
│   ├── components/
│   │   ├── HealthRecordList.vue        — Lista unificada por tipo
│   │   ├── VaccineAlert.vue            — ⚠️ Vence en X días (RN-022)
│   │   ├── HealthTimeline.vue          — Timeline de consultas clínicas
│   │   ├── AttachmentUploader.vue      — Máx 3 archivos, 5MB (RN-023)
│   │   └── PassportShareCard.vue       — Enlace + selector de duración
│   └── services/
│       ├── health.service.ts           — CRUD health_records
│       └── passport.service.ts         — generateShare, getByHash
│
supabase/
├── functions/
│   └── health-alerts-cron/
│       └── index.ts                    — Cron HU-009
└── migrations/
    ├── 0014_add_push_token_to_users.sql  — Columna push_token en users
    ├── 0015_add_alert_prefs_to_users.sql — Columna alert_preferences JSONB
    └── 0016_rls_health_passport.sql      — RLS health_records + passport_shares
```

---

## 4. Plan de implementación

```
DÍA 1
├── Dev 1: RLS health_records (solo propietario de la mascota)
│          RLS passport_shares (anon puede leer si no expiró)
│          Migración push_token y alert_preferences en users
└── Dev 2: HealthDashboardPage (selector de mascota + tabs por tipo)
           VaccinationFormPage con alerta visual RN-022

DÍA 2
├── Dev 1: Supabase RPC para snooze (UPDATE atómico next_due_date)
│          Verificar RLS en staging con usuario real
└── Dev 2: DewormingFormPage con cálculo automático next_due_date en tiempo real
           ClinicalVisitFormPage con AttachmentUploader

DÍA 3
├── Dev 1: HealthTimeline queries (JOIN + ORDER BY)
│          Verificar que adjuntos en Storage son privados (RLS bucket)
└── Dev 2: HealthTimeline UI — vista cronológica
           AlertsSettingsPage con toggles por categoría

DÍA 4
├── Dev 3: Edge Function health-alerts-cron
│          Integración Resend desde Edge Function
│          Solicitud de permiso push + registro de token en PWA
└── Dev 2: PassportPage — vista autenticada
           PassportShareCard — generación de hash e INSERT

DÍA 5
├── Dev 3: Pruebas del cron con fechas simuladas en staging
│          Web Push end-to-end en Android y iOS (A2HS)
└── Dev 2: Ruta pública /passport/:hash
           Pantalla de enlace expirado

DÍA 6-7
└── Integración, pruebas de regresión, correcciones
    Verificar snooze desde notificación push
```

### Criterios de aceptación del Sprint 2

- [ ] Un Tutor puede registrar vacunas con alerta visual cuando vence en < 30 días.
- [ ] El cálculo de `next_due_date` en desparasitaciones es automático y correcto.
- [ ] Un Tutor puede registrar consultas clínicas con hasta 3 adjuntos de máx. 5 MB.
- [ ] El cron diario envía email de alerta a los 30/7/0 días del vencimiento.
- [ ] El snooze actualiza `next_due_date` en +7 días correctamente.
- [ ] El pasaporte compartido genera un enlace único accesible sin sesión.
- [ ] El enlace de pasaporte expirado muestra pantalla de error apropiada.
- [ ] Los registros de salud de un Tutor no son accesibles por otro Tutor (RLS verificada).
