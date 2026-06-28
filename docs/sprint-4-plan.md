# Sprint 4 — Perfiles Comerciales de Proveedores
**Fuente:** `docs/technical-backlog.md` · `docs/SDD_MASTER.md` v1.1
**Duración estimada:** 2 semanas
**Bounded Context:** BC-02 (Gestión de Perfiles — lado comercial)
**HU cubiertas:** HU-005 · HU-006

Sprint bisagra entre el producto para tutores (Sprints 1-3) y el marketplace (Sprint 5). Sin un Proveedor aprobado en el sistema, Sprint 5 no puede funcionar. La aprobación de Proveedores la realiza el Admin mediante **HU-020** (GAP-005 resuelto por RFC-003); este sprint depende de que el Módulo de Administración (HU-018 + HU-020) esté operativo.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 4

| Tarea | Desbloquea directamente |
|---|---|
| **S4-01** Registro de Proveedor | S4-02, S4-03, Sprint 5 completo |
| **S4-02** Galería y portfolio | S5-01 (tarjeta del Proveedor muestra galería) |
| **S4-03** Horarios y disponibilidad | S5-01 (grilla de slots) · S5-02 (reserva sobre slots reales) |

### 1.2 Dependencias previas requeridas

- S1-01 completo: el mismo `auth.user.id` registra como Proveedor. HU-005 presupone que el usuario ya tiene sesión.
- Tabla `providers` con todas sus columnas incluyendo `onboarding_status`, `payout_method`, `billing_email`.
- Tabla `service_areas` para el radio de cobertura geoespacial.
- Tabla `schedules` para la grilla de turnos semanal.
- Bucket `providers` en Storage para galería (imágenes de portfolio).
- Supabase Storage bucket `service-docs` (o similar) para documentación de verificación (GAP-003 provisional).

### 1.3 Reglas de negocio activas en este sprint

| RN | Descripción | Tarea |
|---|---|---|
| RN-001 | Proveedor debe ser aprobado antes de aparecer en búsquedas | S4-01 |
| RN-002 | Onboarding de Mercado Pago requerido para recibir pagos | S4-01 |
| RN-017 | Radio de cobertura en `service_areas` (no radius_km en providers) | S4-01 |
| RN-018 | Galería limitada a 10 fotos (implícito en HU-006) | S4-02 |
| RN-019 | Horarios semanales repetibles | S4-03 |
| RN-020 | Slot de duración configurable por servicio | S4-03 |
| RN-025 | `rating_avg` inicializa en 0, se actualiza por reseñas (Fase 2) | S4-01 |

### 1.4 Gaps activos en este sprint

| GAP | Descripción | Decisión provisional |
|---|---|---|
| GAP-005 | ✅ Resuelto por RFC-003 | La aprobación de Proveedores es HU-020 del Módulo de Administración. El Admin aprueba/rechaza desde `/admin/proveedores` y la acción se registra en `admin_audit_log`. HU-018 y HU-020 deben estar operativos para este sprint. |
| GAP-003 | Mecanismo de verificación de servicio sin definir | Solicitar: nombre legal, CUIT (opcional), descripción del servicio. Sin validación automática. El admin revisa manualmente. |
| GAP-013 | Ambigüedad `radius_km` vs `service_areas` en HU-016 | Usar `service_areas` con polígono/radio PostGIS. `radius_km` en `providers` es campo legacy, no se usa en Sprint 5. |
| GAP-016 | Excepciones y concurrencia en grilla de horarios | Implementar grilla semanal simple (día de semana + hora inicio/fin + duración de slot). Excepciones de festivos quedan como Fase 2. |

### 1.5 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Onboarding Mercado Pago (RN-002) requiere cuenta MLC real | Alta | Alto — ningún Proveedor puede completar el registro sin ella | Crear flujo de onboarding con placeholder. El `onboarding_status` puede quedar en `mp_pending` sin bloquear Sprint 5 en staging. |
| El Módulo de Administración (HU-020) no está listo al iniciar Sprint 4 | Media | Alto — Sprint 5 no tiene datos con qué probar | Priorizar HU-018 + HU-020 (ver `docs/technical-backlog.md`, Módulo de Administración). Como contingencia, aprobar un Proveedor de prueba vía SQL hasta que el panel esté operativo. |
| Galería con fotos de gran tamaño afecta performance | Media | Medio — carga lenta en móvil | Comprimir en cliente a ≤ 1 MB antes del upload. Mostrar thumbnails en listados (usar Supabase Image Transformation si disponible). |
| Grilla de horarios con slots solapados | Media | Alto — reservas dobles | Validar en INSERT de `bookings` (Sprint 5) que no exista otra reserva en el mismo slot. |

---

## 2. Diseño Técnico

### 2.1 S4-01 — Registro de Proveedor (HU-005)

El usuario ya tiene sesión como Tutor o viene directamente desde el registro con el rol `provider` en `user_roles` (RFC-002).

**Estado machine del Proveedor:**

```
registro
    ↓
onboarding_status = 'pending'
    ↓
Admin aprueba (HU-020 · /admin/proveedores · registra en admin_audit_log)
    ↓
onboarding_status = 'approved'
    ↓
Inicia onboarding Mercado Pago
    ↓
onboarding_status = 'mp_pending' → 'active'
```

**INSERT en `providers`:**

```
{
  user_id:           auth.user.id,
  business_name:     form.business_name,
  description:       form.description,
  service_type:      form.service_type,    -- 'veterinaria'|'peluqueria'|'adiestramiento'|'paseador'|'pension'|'otro'
  billing_email:     form.billing_email,
  payout_method:     null,                 -- se completa en onboarding MP
  onboarding_status: 'pending',
  rating_avg:        0,
  verified:          false
}
```

**INSERT en `service_areas`:**

```
{
  provider_id: providers.id,
  area:        ST_Buffer(ST_MakePoint({lng}, {lat})::geography, {radius_metros})::geometry
  -- radio en metros: 1000 / 3000 / 5000 / 10000 / 20000
}
```

**Alta del rol en `user_roles` (RFC-002):**

```
INSERT INTO user_roles (user_id, role) VALUES (auth.user.id, 'provider')
ON CONFLICT (user_id, role) DO NOTHING
-- El rol 'tutor' previo (si existe) se conserva: el usuario acumula ambos roles.
```

**Inicio de onboarding Mercado Pago (RN-002):**

```
Edge Function: mp-provider-onboarding
  → Crea Access Token de vendedor en MP Marketplace
  → Devuelve URL de redirección OAuth de MP
  → Guarda mp_user_id en providers (columna nueva via RFC o provisional)
  → UPDATE onboarding_status = 'mp_pending'
```

---

### 2.2 S4-02 — Galería y portfolio (HU-006 — parte 1)

**Upload de fotos al bucket `providers`:**

```
ruta: providers/{provider_id}/gallery/{timestamp}_{filename}
```

**Validaciones (RN-018):**
- Máx. 10 fotos por proveedor.
- Verificar COUNT antes de cada upload.
- Si `count >= 10` → rechazar con mensaje de error.

**SELECT de la galería:**

```sql
SELECT photo_url
FROM provider_photos   -- tabla en memoria o JSONB array en providers
WHERE provider_id = {id}
ORDER BY uploaded_at ASC
LIMIT 10
```

**Nota:** el SDD no define tabla `provider_photos`. Implementar como campo `gallery_urls TEXT[]` en `providers`. Si supera el alcance, emitir RFC. Decisión provisional: `gallery_urls TEXT[]` con `CHECK (array_length(gallery_urls, 1) <= 10)`.

**Ordenamiento:** el Proveedor puede reordenar su galería. Guardar el array en el orden deseado.

---

### 2.3 S4-03 — Grilla de horarios (HU-006 — parte 2)

**INSERT en `schedules`:**

```
{
  provider_id:     providers.id,
  day_of_week:     0..6,       -- 0=Domingo, 1=Lunes, ... 6=Sábado
  start_time:      '09:00',    -- TIME
  end_time:        '18:00',    -- TIME
  slot_duration:   60          -- minutos. Valores: 30|45|60|90|120
}
```

**Generación de slots (lógica del cliente):**

```
slots = []
cursor = start_time
WHILE cursor + slot_duration <= end_time:
  slots.append({ start: cursor, end: cursor + slot_duration })
  cursor += slot_duration
RETURN slots
```

**Grilla semanal en la UI:**

```
Lunes    | [09:00] [10:00] [11:00] ... [17:00]
Martes   | [09:00] [10:00] ...
...
Sábado   | [10:00] [11:00] [12:00]
Domingo  | (sin horarios)
```

El Proveedor puede editar los horarios de cada día independientemente. Si se elimina un día, DELETE del registro de `schedules` para ese `day_of_week`.

**Excepción de concurrencia (GAP-016):**
En este sprint: no se implementan festivos ni excepciones puntuales. Los slots son fijos semana a semana. La validación de reservas dobles ocurre en Sprint 5.

---

## 3. Archivos nuevos en este sprint

```
src/
├── bc02-profiles/
│   ├── pages/
│   │   ├── ProviderRegisterPage.vue    — HU-005: formulario de registro
│   │   ├── ProviderOnboardingPage.vue  — HU-005: flujo MP onboarding
│   │   ├── ProviderProfilePage.vue     — HU-006: edición de perfil comercial
│   │   ├── GalleryManagerPage.vue      — HU-006: carga y orden de fotos
│   │   └── ScheduleManagerPage.vue     — HU-006: grilla de horarios
│   ├── components/
│   │   ├── ProviderStatusBadge.vue     — pending/approved/active
│   │   ├── ServiceAreaMap.vue          — Mapa con radio de cobertura dibujado
│   │   ├── GalleryGrid.vue             — Grid de fotos con drag para reordenar
│   │   ├── GalleryUploader.vue         — Upload con validación de 10 fotos
│   │   └── WeeklyScheduleEditor.vue    — Editor de grilla semanal
│   └── services/
│       ├── provider.service.ts         — register, update, getById
│       ├── gallery.service.ts          — upload, delete, reorder
│       └── schedule.service.ts         — createSlots, updateDay, deleteDay
│
supabase/
├── functions/
│   └── mp-provider-onboarding/
│       └── index.ts                    — Inicia OAuth MP y guarda mp_user_id
└── migrations/
    ├── 0019_add_gallery_urls_to_providers.sql   — gallery_urls TEXT[] + CHECK
    ├── 0020_rls_providers.sql                   — RLS providers + service_areas + schedules
    └── 0021_rls_bookings_providers.sql          — RLS bookings para providers
```

---

## 4. Plan de implementación

```
DÍA 1
├── Dev 1: RLS providers: solo propietario puede leer/escribir su perfil
│          RLS service_areas: lectura pública, escritura solo propietario
│          Migración gallery_urls TEXT[] en providers
└── Dev 2: ProviderRegisterPage — formulario completo con service_type y zona
           ServiceAreaMap con selector de radio

DÍA 2
├── Dev 1: RLS schedules: lectura pública (para mostrar disponibilidad), escritura propietario
│          INSERT service_areas con ST_Buffer
└── Dev 2: ProviderOnboardingPage — estado de aprobación y estado MP
           ProviderStatusBadge — pending/mp_pending/active

DÍA 3
├── Dev 3: Edge Function mp-provider-onboarding
│          Crear cuenta MP Marketplace sandbox, probar flujo OAuth
└── Dev 2: GalleryManagerPage + GalleryUploader
           Validación COUNT < 10 antes de upload

DÍA 4
├── Dev 3: Prueba end-to-end del onboarding MP en sandbox
│          Guardar mp_user_id en providers tras callback OAuth
└── Dev 2: GalleryGrid con reordenamiento (drag & drop o flechas)
           ProviderProfilePage — edición general

DÍA 5
├── Dev 1: ScheduleManagerPage queries (GET/POST/DELETE por day_of_week)
│          Verificar que los slots generados son consistentes
└── Dev 2: WeeklyScheduleEditor — grilla visual por día
           Integración con schedule.service.ts

DÍA 6-7
└── Integración completa del flujo Proveedor
    Crear Proveedor de prueba aprobado manualmente en staging
    (UPDATE providers SET onboarding_status = 'active' WHERE id = {test_id})
    Este Proveedor es el dataset de Sprint 5
```

### Criterios de aceptación del Sprint 4

- [ ] Un usuario puede registrarse como Proveedor con sus datos comerciales y zona de cobertura.
- [ ] El estado inicial es `pending` y el Proveedor ve un banner de "En revisión".
- [ ] El Admin puede aprobar/rechazar el Proveedor desde `/admin/proveedores` (HU-020), con registro en `admin_audit_log`.
- [ ] Un Proveedor activo puede acceder al flujo de onboarding de Mercado Pago (sandbox).
- [ ] El Proveedor puede subir hasta 10 fotos de galería y reordenarlas.
- [ ] El sistema rechaza la foto 11 con mensaje de error claro.
- [ ] El Proveedor puede definir su grilla de horarios por día de la semana con slot_duration.
- [ ] Los slots generados a partir de start_time/end_time/duration son correctos.
- [ ] La RLS no permite que un Proveedor edite el perfil de otro.
- [ ] Existe al menos un Proveedor activo en staging listo para Sprint 5.
