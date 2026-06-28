# Sprint 3 — Comunidad y Mascotas Perdidas
**Fuente:** `docs/technical-backlog.md` · `docs/SDD_MASTER.md` v1.1
**Duración estimada:** 2 semanas
**Bounded Context:** BC-04 (Comunidad y Mascotas Perdidas)
**HU cubiertas:** HU-012 · HU-013 · HU-014 · HU-015

Es el primer módulo con acceso público sin sesión y el de mayor potencial viral. Introduce notificaciones push masivas geolocalizadas y el motor de coincidencias. Depende de la infraestructura push de Sprint 2.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 3

BC-04 es un módulo cerrado que no bloquea sprints posteriores en dependencia técnica directa. Su impacto es de negocio: es el principal motor de adquisición orgánica de Fase 1.

| Tarea | Relación con otros sprints |
|---|---|
| **S3-01** Reporte de pérdida | Bloquea S3-02 y S3-04 (necesita datos en `lost_reports`) |
| **S3-02** Mapa comunitario | Depende de S3-01 para tener pines que mostrar |
| **S3-03** Reporte encontrada | Depende de S3-01 para tener reportes contra los que hacer matching |
| **S3-04** Cierre de reporte | Depende de S3-01 para existir el reporte a cerrar |

### 1.2 Dependencias previas requeridas

- S0-03 completo: índice GIST sobre `locations.coordinates`. Sin él, `ST_DWithin` es full-scan.
- S1-01 completo: sesión de Tutor para reportes autenticados.
- S1-03 completo: tabla `pets` para vinculación opcional en reportes.
- S2-04 completo: infraestructura Web Push (VAPID keys, tokens, Edge Function base). S3-01 reutiliza exactamente esta infraestructura.
- Tabla `lost_reports` con todas sus columnas incluyendo `location_id`.
- Bucket de Storage para fotos de `lost_reports` (puede ser el mismo bucket `pets` o uno dedicado).

### 1.3 Reglas de negocio activas en este sprint

| RN | Descripción | Tarea |
|---|---|---|
| RN-012 | Push masivo a usuarios en radio de 5 KM al reportar pérdida | S3-01 |
| RN-013 | Ciclo de vida: `lost` → `found` → `closed` | S3-01, S3-04 |
| RN-014 | Motor de coincidencias en radio de 3 KM (especie, raza, color) | S3-03 |
| RN-015 | Mapa comunitario público sin sesión requerida | S3-02 |
| RN-026 | Publicación automática en feed al cerrar reporte | S3-04 |

### 1.4 Gaps activos en este sprint

| GAP | Descripción | Decisión provisional |
|---|---|---|
| GAP-011 | Push masivo sin throttling definido | Limitar a 500 destinatarios por evento. Si el radio tiene más, tomar los 500 más cercanos. |
| GAP-012 | Algoritmo del motor de coincidencias sin definir | Matching exacto por `species`. Matching parcial (ILIKE) por `color`. `breed` queda como mejora futura. |
| GAP-015 | Feed de zona no definido en SDD | S3-04 dispara la Edge Function pero no renderiza feed. Emitir evento en tabla `feed_events` sin UI. |
| GAP-018 | Fallback de geolocalización denegada en HU-013 | Mostrar mapa centrado en Córdoba Capital con mensaje explicativo. |
| GAP-019 | Recompensa en ARS: informativa o gestionada | Solo informativa. Campo texto visible en el reporte. Sin lógica financiera. |

### 1.5 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Edge Function timeout en push masivo | Media | Alto — no llegan notificaciones | Procesar en batches de 100. Edge Function con timeout extendido. |
| Usuarios sin token push en radio de 5 KM | Alta | Medio — notificación no llega | No hay canal de respaldo para HU-012. Es aceptado por el SDD. |
| Fotos ofensivas en reportes públicos | Media | Alto — reputación de la app | Sin moderación automática en MVP. Admin puede eliminar manualmente. |
| Motor de coincidencias con falsos positivos | Alta | Bajo — solo incomoda al usuario | El matching es una sugerencia, no una afirmación. La UI lo comunica claramente. |

---

## 2. Diseño Técnico

### 2.1 S3-01 — Reporte de mascota perdida (HU-012)

**INSERT en `lost_reports` + `locations`:**

```
Transacción:
  1. INSERT locations { coordinates, address }
  2. INSERT lost_reports {
       user_id:       auth.user.id (nullable si anónimo),
       pet_id:        form.pet_id (nullable),
       location_id:   locations.id,
       type:          'lost',
       status:        'lost',
       photo_url:     (upload previo a Storage),
       name:          form.name,
       species:       form.species,
       breed:         form.breed,
       color:         form.color,
       sex:           form.sex,
       incident_date: form.incident_date,
       behavior:      form.behavior,
       contact_phone: form.contact_phone,
       reward_ars:    form.reward_ars   -- solo informativo, nullable
     }
  3. → Dispara Edge Function lost-pet-notify
```

**Edge Function — `lost-pet-notify`:**

```
Disparador: INSERT en lost_reports WHERE type = 'lost'

Lógica:
  suscripciones_en_radio = SELECT ps.endpoint, ps.p256dh, ps.auth
                           FROM push_subscriptions ps        -- RFC-001
                           JOIN users u ON u.id = ps.user_id
                           JOIN locations l ON l.id = u.location_id
                           WHERE ST_DWithin(l.coordinates, lost_report.coordinates, 5000)
                           LIMIT 500   -- throttle GAP-011

  Para cada suscripción (en batches de 100):
    sendPush(subscription, {
      title: "🐾 Mascota perdida cerca tuyo",
      body:  "{name} ({species}) perdida en tu zona",
      data:  { lost_report_id }
    })
```

---

### 2.2 S3-02 — Mapa comunitario de alertas (HU-013)

**Ruta pública** — sin guard de autenticación (RN-015).

**Query de reportes activos:**
```sql
SELECT lr.*, l.coordinates, l.address
FROM lost_reports lr
JOIN locations l ON l.id = lr.location_id
WHERE lr.status = 'lost'
  AND lr.type = 'lost'
  AND ST_DWithin(l.coordinates, ST_MakePoint({lng}, {lat}), {radio_metros})
  AND lr.incident_date >= {fecha_filtro}
  AND (lr.species = {especie_filtro} OR {especie_filtro} IS NULL)
ORDER BY l.coordinates <-> ST_MakePoint({lng}, {lat})
```

**Radios disponibles (HU-013):** 5.000 · 10.000 · 20.000 metros.

**Fallback de geolocalización (GAP-018):**
- Si el usuario deniega: centrar mapa en `{ lat: -31.4135, lng: -64.1811 }` (Córdoba Capital).
- Mostrar banner: "Activá la ubicación para ver alertas en tu zona".

**Card flotante al presionar pin:**
- Foto, nombre, especie, color, fecha del suceso, días transcurridos.
- Botón "Tengo información" → redirige al formulario de HU-014 o abre WhatsApp con número de contacto.

---

### 2.3 S3-03 — Reporte de mascota encontrada (HU-014)

**Formulario público** — sin autenticación requerida.

**INSERT en `lost_reports`:**
```
{
  user_id:       null (anónimo),
  type:          'found',
  status:        'lost',    -- reutiliza el ciclo de vida del reporte de pérdida
  photo_url:     (upload),
  species:       form.species,
  color:         form.color,
  contact_phone: form.contact_phone,
  location_id:   (INSERT locations previo)
}
```

**Edge Function — `found-pet-match`:**

```
Disparador: INSERT en lost_reports WHERE type = 'found'

Lógica (motor de coincidencias — GAP-012):
  reportes_compatibles = SELECT lr.*, ps.endpoint, ps.p256dh, ps.auth
                         FROM lost_reports lr
                         JOIN locations l ON l.id = lr.location_id
                         JOIN users u ON u.id = lr.user_id
                         JOIN push_subscriptions ps ON ps.user_id = u.id  -- RFC-001
                         WHERE lr.status = 'lost'
                           AND lr.type = 'lost'
                           AND lr.species = found_report.species       -- exacto
                           AND lr.color ILIKE '%' || found_report.color || '%' -- parcial
                           AND ST_DWithin(l.coordinates, found_report.coordinates, 3000)

  Para cada reporte compatible:
    sendPush(subscription, {
      title: "🔍 Posible coincidencia encontrada",
      body:  "Alguien encontró un {species} similar a {pet_name} a {X} metros",
      data:  { found_report_id, lost_report_id }
    })
```

---

### 2.4 S3-04 — Cierre de reporte por éxito (HU-015)

**Solo el Tutor propietario del reporte puede cerrarlo.**

```
Verificación de autorización:
  lost_reports.user_id = auth.user.id

UPDATE lost_reports SET status = 'found' WHERE id = {id}
  → Dispara Edge Function report-closed
```

**Edge Function — `report-closed`:**

```
Disparador: UPDATE lost_reports WHERE status cambia a 'found'

Lógica (GAP-015):
  INSERT feed_events {
    type:       'pet_found',
    location_id: lost_report.location_id,
    payload:    { pet_name, message: "¡{name} fue encontrada! 🎉" }
  }
  -- Sin UI de feed en este sprint. El evento queda en la tabla.
```

---

## 3. Archivos nuevos en este sprint

```
src/
├── bc04-community/
│   ├── pages/
│   │   ├── LostPetFormPage.vue       — HU-012: formulario de pérdida
│   │   ├── CommunityMapPage.vue      — HU-013: mapa público
│   │   ├── FoundPetFormPage.vue      — HU-014: formulario público de encontrada
│   │   └── ReportDetailPage.vue      — HU-015: detalle con botón "¡La encontré!"
│   ├── components/
│   │   ├── LostPetMap.vue            — Mapa con pines (leaflet o mapbox)
│   │   ├── LostPetPin.vue            — Pin interactivo con card flotante
│   │   ├── LostPetCard.vue           — Card flotante al presionar pin
│   │   ├── RadiusSelector.vue        — Toggle 5/10/20 KM
│   │   ├── ReportStatusBadge.vue     — lost / found / closed
│   │   └── SpeciesFilter.vue         — Filtro por especie
│   └── services/
│       └── lost-report.service.ts    — create, getByRadius, close, getById
│
supabase/
├── functions/
│   ├── lost-pet-notify/
│   │   └── index.ts                  — Edge Function HU-012
│   ├── found-pet-match/
│   │   └── index.ts                  — Edge Function HU-014
│   └── report-closed/
│       └── index.ts                  — Edge Function HU-015
└── migrations/
    ├── 0017_create_feed_events.sql   — Tabla feed_events (para GAP-015)
    └── 0018_rls_lost_reports.sql     — RLS: público para lectura, autenticado para escritura
```

---

## 4. Plan de implementación

```
DÍA 1
├── Dev 1: RLS lost_reports
│          - SELECT: público (anon) para status='lost'
│          - INSERT: autenticado o anónimo (user_id nullable)
│          - UPDATE status: solo propietario
│          Migración feed_events
└── Dev 2: LostPetFormPage — formulario con selector de mascota propia o anónima
           Upload de foto a Storage

DÍA 2
├── Dev 3: Edge Function lost-pet-notify
│          ST_DWithin 5KM + batch push + throttle 500
└── Dev 2: CommunityMapPage — mapa base con pines
           RadiusSelector + fallback de geolocalización (GAP-018)

DÍA 3
├── Dev 3: Edge Function found-pet-match
│          Motor de coincidencias: species exacto + color ILIKE + ST_DWithin 3KM
└── Dev 2: LostPetPin + LostPetCard (card flotante)
           Filtros especie y fecha en el mapa

DÍA 4
├── Dev 3: Edge Function report-closed → INSERT feed_events
│          Pruebas end-to-end: reporte → push → match
└── Dev 2: FoundPetFormPage (público, sin auth)
           ReportDetailPage con botón "¡La encontré!" (solo propietario)

DÍA 5
├── Dev 1: Verificar RLS: ciudadano anónimo puede ver mapa y crear reporte encontrada
│          Verificar: solo propietario puede cerrar su reporte
└── Dev 2: ReportStatusBadge + integración completa del ciclo lost→found

DÍA 6-7
└── Pruebas de integración completas
    Simular push masivo con staging data
    Verificar motor de coincidencias con casos de prueba reales
```

### Criterios de aceptación del Sprint 3

- [ ] Un Tutor puede publicar un reporte de pérdida con foto y ubicación.
- [ ] Al publicar, se envía push a usuarios en radio de 5 KM (verificable en staging).
- [ ] El mapa comunitario es accesible sin sesión y muestra pines activos.
- [ ] Los filtros de especie y fecha funcionan sobre el mapa.
- [ ] Un ciudadano sin cuenta puede reportar una mascota encontrada.
- [ ] El motor de coincidencias notifica al Tutor con reporte compatible.
- [ ] Solo el Tutor propietario puede marcar su reporte como "¡La encontré!".
- [ ] El evento de cierre se registra en `feed_events`.
- [ ] La RLS permite lectura pública de reportes activos y escritura autenticada.
