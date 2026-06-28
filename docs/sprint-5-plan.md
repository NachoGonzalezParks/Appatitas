# Sprint 5 — Marketplace Transaccional
**Fuente:** `docs/technical-backlog.md` · `docs/SDD_MASTER.md` v1.1
**Duración estimada:** 2 semanas
**Bounded Context:** BC-05 (Marketplace Transaccional)
**HU cubiertas:** HU-016 · HU-017

⚠️ **Sprint bloqueado por 4 Gaps críticos.** Este sprint no puede iniciarse sin resolverlos mediante RFC.

---

## ⛔ Prerequisito absoluto — Resolución de Gaps antes de iniciar

Los siguientes gaps son bloqueantes totales. El equipo debe resolverlos y actualizar el SDD antes del Día 1 de este sprint.

| GAP | Descripción | Responsable de resolver |
|---|---|---|
| **GAP-001** | HU-017 no tiene criterios de aceptación | Product Owner / Comercial |
| **GAP-002** | Porcentaje de comisión APPATITAS no definido | Comercial / Legal |
| **GAP-003** | Verificación de servicio y liberación de fondos sin definir | Product Owner / MP |
| **GAP-007** | Ciclo de vida completo de estados de `bookings` no documentado | Dev Lead + Product Owner |

Sin resolver estos gaps, cualquier implementación de Sprint 5 viola REGLA-3 del `SDD_LOCK.md`.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 5

Sprint 5 cierra Fase 1 del producto. No hay sprints posteriores en el alcance del SDD v1.1.

| Tarea | Rol en el sistema |
|---|---|
| **S5-01** Búsqueda geoespacial de Proveedores | Primera funcionalidad monetizable de APPATITAS |
| **S5-02** Grilla de disponibilidad | Interfaz de acceso a los turnos del Proveedor |
| **S5-03** Reserva y pago con escrow | Transacción completa con Mercado Pago |

### 1.2 Dependencias previas requeridas (todas deben estar completas)

- **S4-01 completo:** al menos un Proveedor con `onboarding_status = 'active'` en staging.
- **S4-03 completo:** `schedules` con slots reales para ese Proveedor.
- **S1-02 completo:** `users.location_id` con coordenadas reales (origen de la búsqueda).
- **S0-03 completo:** índice GIST activo. Sin él, la búsqueda geoespacial es full-scan.
- **Mercado Pago:** cuenta MLC aprobada como Marketplace. Sin esto, el pago es ficticio.
- Tablas: `bookings` · `booking_status_events` · `service_areas` · `providers`.

### 1.3 Reglas de negocio activas en este sprint

| RN | Descripción | Tarea |
|---|---|---|
| RN-001 | Solo Proveedores con `onboarding_status = 'active'` aparecen en búsqueda | S5-01 |
| RN-002 | Solo Proveedores con onboarding MP completo pueden recibir pagos | S5-03 |
| RN-017 | Búsqueda usa `service_areas` con PostGIS, no radio fijo | S5-01 |
| RN-021 | `booking_status_events` es log inmutable — sin UPDATE ni DELETE | S5-03 |
| **RN-???** | Comisión de APPATITAS (% a definir en GAP-002) | S5-03 |
| **RN-???** | Criterio de liberación de fondos (a definir en GAP-003) | S5-03 |

### 1.4 Gaps activos en este sprint

| GAP | Descripción | Decisión provisional (si se permite avanzar) |
|---|---|---|
| GAP-001 | HU-017 sin criterios de aceptación | **No se puede avanzar sin resolverlo.** Detener. |
| GAP-002 | Comisión % no definida | **No se puede avanzar sin resolverlo.** Detener. |
| GAP-003 | Liberación de fondos sin definir | **No se puede avanzar sin resolverlo.** Detener. |
| GAP-007 | Ciclo de vida de estados de reserva | **No se puede avanzar sin resolverlo.** Detener. |
| GAP-008 | Rating system sin definir | Mostrar `rating_avg = 0` en tarjeta de Proveedor. No implementar lógica de reseñas. |
| GAP-013 | `radius_km` vs `service_areas` | Usar `service_areas` (PostGIS). Ignorar `radius_km`. |
| GAP-016 | Excepciones de festivos en grilla | No implementar. Slots son fijos semana a semana. |

### 1.5 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cuenta MP Marketplace sin aprobar | Alta | Crítico — no hay pagos reales | Implementar con sandbox de MP. No salir a producción hasta tener cuenta real aprobada. |
| Concurrencia: dos Tutores reservan el mismo slot | Media | Alto — doble reserva | Usar transacción con SELECT FOR UPDATE o constraint UNIQUE en `bookings(provider_id, scheduled_at)`. |
| Webhook de MP no llega a la Edge Function | Media | Alto — reserva queda en `pending` eternamente | Implementar timeout de 15 minutos: si no llega el webhook, la reserva pasa a `expired`. |
| Estado de reserva indefinido (GAP-007) | Alta | Crítico | El ciclo de vida completo DEBE estar documentado antes del Día 1. |

---

## 2. Diseño Técnico

### 2.1 S5-01 — Búsqueda geoespacial de Proveedores (HU-016)

**Query central:**

```sql
SELECT p.*, u.avatar_url, u.nombre,
       ST_Distance(sa.area::geography, ST_MakePoint({user_lng}, {user_lat})::geography) AS distance_m
FROM providers p
JOIN users u ON u.id = p.user_id
JOIN service_areas sa ON sa.provider_id = p.id
WHERE p.onboarding_status = 'active'
  AND p.service_type = {filtro_servicio}         -- nullable
  AND ST_DWithin(sa.area::geography, ST_MakePoint({user_lng}, {user_lat})::geography, {radio_metros})
ORDER BY distance_m ASC
LIMIT 20
```

**Filtros disponibles (HU-016):**
- Tipo de servicio (veterinaria, peluquería, adiestramiento, paseador, pensión).
- Radio: 5 · 10 · 20 KM.
- Ordenamiento: por distancia (default) · por rating.

**Tarjeta de Proveedor en resultados:**
- Avatar · nombre del negocio · tipo de servicio.
- Distancia calculada.
- Precio (campo no en SDD v1.1 — no implementar hasta RFC).
- Rating (`rating_avg`, mostrando 0 si no tiene reseñas).
- Foto principal de galería (primera de `gallery_urls`).
- Botón "Ver disponibilidad".

---

### 2.2 S5-02 — Grilla de disponibilidad (HU-017, parte 1)

**Generar slots disponibles para la próxima semana:**

```
Para cada día de los próximos 7 días:
  1. Obtener schedules del provider para ese day_of_week
  2. Generar slots (start_time..end_time, paso=slot_duration)
  3. Restar slots ya reservados:
     SELECT scheduled_at FROM bookings
     WHERE provider_id = {id}
       AND scheduled_at BETWEEN {hoy} AND {hoy + 7 días}
       AND status NOT IN ('cancelled_by_tutor', 'cancelled_by_provider', 'expired')
  4. Slots disponibles = generados - reservados
```

**UI de la grilla:**
- Selector de día (próximos 7 días, sin domingo si el Proveedor no trabaja ese día).
- Lista de slots disponibles como chips clickeables.
- Slot seleccionado → se resalta → botón "Confirmar turno" aparece.
- Selección de mascota del Tutor (lista de `pets` sin `deleted_at`).

---

### 2.3 S5-03 — Reserva y pago con escrow (HU-017, parte 2)

**Flujo de pago completo:**

```
Tutor selecciona slot + mascota
    ↓
[1] INSERT bookings {
      tutor_id:    auth.user.id,
      provider_id: {id},
      pet_id:      form.pet_id,
      scheduled_at: slot.start,
      status:      'pending_payment',
      amount_ars:  form.amount              -- precio del servicio
    }
    INSERT booking_status_events {
      booking_id: bookings.id,
      from_status: null,
      to_status:   'pending_payment',
      triggered_by: auth.user.id
    }

[2] Edge Function: mp-create-payment
    → Crea preferencia de pago en Mercado Pago Marketplace
    → amount_provider = amount_ars * (1 - comision_pct)
    → amount_appatitas = amount_ars * comision_pct
    → Devuelve init_point (URL de checkout de MP)
    → UPDATE bookings SET mp_payment_id = preference.id

[3] Tutor es redirigido a init_point (checkout MP)
    → Pago aprobado → MP llama al webhook

[4] Edge Function: mp-payment-webhook
    → Verifica la firma del webhook
    → Si payment.status = 'approved':
        UPDATE bookings SET status = 'confirmed'
        INSERT booking_status_events { from: 'pending_payment', to: 'confirmed' }
        sendPush(provider push_subscriptions, "Nueva reserva confirmada")  -- RFC-001
        sendEmail(provider.billing_email, "Nueva reserva")
    → Si payment.status = 'rejected':
        UPDATE bookings SET status = 'payment_failed'
        INSERT booking_status_events { from: 'pending_payment', to: 'payment_failed' }

[5] Servicio prestado:
    → Tutor (o Provider) marca el servicio como completado
        UPDATE bookings SET status = 'completed'
        INSERT booking_status_events { from: 'confirmed', to: 'completed' }
    → GAP-003: liberación de fondos al Proveedor aquí.
        Acción a definir via RFC antes del Sprint.
```

**Ciclo de vida completo de `bookings.status` (GAP-007 — esqueleto a completar):**

```
null
  → pending_payment   (Tutor selecciona slot y va al pago)
  → confirmed         (MP aprueba el pago)
  → completed         (Servicio prestado y confirmado)
  → cancelled_by_tutor    (Tutor cancela antes del servicio)
  → cancelled_by_provider (Proveedor cancela)
  → payment_failed    (MP rechaza el pago)
  → expired           (15 min sin webhook desde pending_payment)
```

**Timeout de `pending_payment` (riesgo 3):**
```
Edge Function: booking-expiry-cron
  Disparador: cron '*/5 * * * *' (cada 5 minutos)
  
  UPDATE bookings SET status = 'expired'
  WHERE status = 'pending_payment'
    AND created_at < now() - INTERVAL '15 minutes'
  RETURNING id → INSERT booking_status_events para cada uno
```

---

## 3. Archivos nuevos en este sprint

```
src/
├── bc05-marketplace/
│   ├── pages/
│   │   ├── SearchPage.vue              — HU-016: búsqueda y filtros
│   │   ├── ProviderDetailPage.vue      — HU-016: perfil público del Proveedor
│   │   ├── AvailabilityPage.vue        — HU-017: grilla de disponibilidad
│   │   ├── BookingCheckoutPage.vue     — HU-017: resumen previo al pago
│   │   ├── BookingSuccessPage.vue      — HU-017: confirmación post-pago
│   │   └── BookingListPage.vue         — Mis reservas (Tutor y Proveedor)
│   ├── components/
│   │   ├── ProviderCard.vue            — Tarjeta de resultados de búsqueda
│   │   ├── SearchFilters.vue           — Servicio + radio + ordenamiento
│   │   ├── SlotPicker.vue              — Grilla de días/slots
│   │   ├── BookingStatusTimeline.vue   — Historial de estados
│   │   └── PaymentRedirectButton.vue   — "Ir a pagar" → init_point
│   └── services/
│       ├── search.service.ts           — searchProviders (con PostGIS)
│       ├── availability.service.ts     — getAvailableSlots
│       └── booking.service.ts          — createBooking, cancel, complete
│
supabase/
├── functions/
│   ├── mp-create-payment/
│   │   └── index.ts                    — Crea preferencia MP Marketplace
│   ├── mp-payment-webhook/
│   │   └── index.ts                    — Webhook MP → actualiza booking
│   └── booking-expiry-cron/
│       └── index.ts                    — Cron 5min → expira pending_payment
└── migrations/
    ├── 0022_rls_bookings_final.sql     — RLS completa de bookings
    ├── 0023_rls_booking_events.sql     — booking_status_events: solo INSERT
    └── 0024_unique_booking_slot.sql    — UNIQUE(provider_id, scheduled_at) en bookings activos
```

---

## 4. Plan de implementación

```
⚠️ Este plan asume que los 4 gaps críticos fueron resueltos antes del Día 1.

DÍA 1
├── Dev 1: RLS bookings: Tutor ve sus propias reservas, Proveedor ve las de su agenda
│          UNIQUE constraint en bookings(provider_id, scheduled_at) para anti-concurrencia
│          Migración de constraint
└── Dev 2: SearchPage con filtros de servicio y radio
           Integración con query PostGIS de providers

DÍA 2
├── Dev 1: RLS booking_status_events: solo INSERT, sin UPDATE ni DELETE
│          Verificar que constraint UNIQUE no bloquea slots cancelados
└── Dev 2: ProviderDetailPage (perfil público completo, galería, descripción)
           SlotPicker: generación y filtrado de slots disponibles

DÍA 3
├── Dev 3: Edge Function mp-create-payment
│          Integración con Mercado Pago Marketplace sandbox
│          Verificar split de comisión
└── Dev 2: BookingCheckoutPage (resumen: slot, mascota, monto, botón pagar)
           BookingSuccessPage + BookingListPage (mis reservas)

DÍA 4
├── Dev 3: Edge Function mp-payment-webhook
│          Verificación de firma del webhook MP
│          UPDATE booking → INSERT booking_status_events
│          Notificación push+email al Proveedor
└── Dev 2: BookingStatusTimeline (historial de estados del booking)
           Flujo de cancelación con INSERT en booking_status_events

DÍA 5
├── Dev 3: Edge Function booking-expiry-cron (cada 5 min)
│          Pruebas end-to-end: pago aprobado / rechazado / expirado
└── Dev 1: Verificar anti-concurrencia: dos requests simultáneos al mismo slot
           Verificar que SELECT FOR UPDATE o el UNIQUE constraint lo resuelve

DÍA 6-7
└── Pruebas de integración completas con cuenta MP sandbox real
    Verificar todos los estados del ciclo de vida de reservas
    Preparar checklist de salida a producción:
    - Cuenta MP real aprobada
    - Webhook URL apuntando a producción
    - Variables de entorno de producción configuradas
```

### Criterios de aceptación del Sprint 5

- [ ] Un Tutor puede buscar Proveedores por tipo de servicio y radio con resultados geolocalizados.
- [ ] Los Proveedores sin `onboarding_status = 'active'` no aparecen en resultados.
- [ ] La grilla de disponibilidad muestra solo slots sin reserva activa.
- [ ] Dos Tutores no pueden reservar el mismo slot simultáneamente.
- [ ] El Tutor es redirigido al checkout de Mercado Pago al confirmar un turno.
- [ ] El webhook de MP aprobado actualiza el booking a `confirmed` y notifica al Proveedor.
- [ ] El webhook de MP rechazado actualiza el booking a `payment_failed`.
- [ ] Los bookings en `pending_payment` por más de 15 minutos pasan a `expired`.
- [ ] Cada transición de estado genera un registro en `booking_status_events` (inmutable).
- [ ] El Tutor puede ver el historial de estados de su reserva.
- [ ] La RLS impide que un Tutor vea las reservas de otro.

---

## 5. Checklist pre-producción

Antes de habilitar Sprint 5 en producción:

- [ ] Cuenta Mercado Pago Marketplace aprobada (no sandbox).
- [ ] CUIT de APPATITAS registrado en MP.
- [ ] Porcentaje de comisión definido en variable de entorno (GAP-002 resuelto).
- [ ] Criterio de liberación de fondos implementado (GAP-003 resuelto).
- [ ] Webhook URL de producción configurado en el panel de MP.
- [ ] HU-017 con criterios de aceptación completos en el SDD (GAP-001 resuelto).
- [ ] Ciclo de vida de `bookings.status` documentado en `business-rules.md` (GAP-007 resuelto).
- [ ] Al menos 5 Proveedores activos con horarios cargados en producción.
- [ ] Plan de soporte para disputas de pago definido.
