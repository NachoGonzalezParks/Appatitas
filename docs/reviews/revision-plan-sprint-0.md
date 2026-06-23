# Revisión del plan y del corpus normativo — Pre Sprint 0

**Autor:** Alejandro González (aegonzalez73)
**Fecha:** 2026-06-23
**Alcance:** Revisión de (1) reparto de tareas, (2) modelo de trabajo conjunto y
(3) inconsistencias del corpus normativo, antes de iniciar el Sprint 0.
**Objetivo:** Discutir estos puntos entre los 3 desarrolladores y acordar acciones.

> Documento de discusión. No modifica el corpus normativo. Los cambios de esquema
> que se derivan de la sección 3 se proponen por separado en
> [`RFC-001`](../rfcs/RFC-001-perfil-tutor-y-push-subscriptions.md).

---

## 1. Reparto de tareas y coherencia de los carriles

### ¿Están asignadas las tareas?
No. El `sprint-0-plan.md` §4.1 define dos **carriles** (A y B) pero **no asigna
tareas a personas**. Problema: el equipo es de **3 desarrolladores** (ADR-001 §Context;
firmas de SDD_LOCK §7) pero el plan sólo prevé **2 carriles**, y están
**desbalanceados** (el Carril A concentra todo el backend de datos + storage).

### Coherencia de A y B
La división backend/datos (A) vs frontend/PWA (B) es razonable y respeta las
dependencias internas del sprint. Puntos frágiles detectados:

| Punto | Riesgo |
|---|---|
| Tabla `users` (migración `0002`, Carril A día 2) y su **trigger** de llenado desde `auth.users` (S0-04, Carril B día 3) quedan en carriles distintos | Punto de coordinación que puede romperse |
| Carril B día 3 hace Auth (S0-04) **y** Resend (S0-07) el mismo día | Sobrecarga de una persona |
| S0-04 (SMTP) depende de S0-07 (DNS, hasta 48h), ambos en el mismo carril | Si esa persona se traba, caen las dos |
| Integración recién el día 5, sin propietario | Riesgo de integración tardía |

### Propuesta
Asignar **3 roles explícitos** y rebalancear:

- **Dev 1 — Datos:** S0-01 + S0-02 (migraciones) + S0-03 (índice GIST).
- **Dev 2 — Frontend:** S0-06 (scaffold PWA, Service Worker, manifest, cliente Supabase).
- **Dev 3 — Plataforma:** S0-04 (Auth + trigger `users`) + S0-05 (Storage) +
  S0-07 (Resend) + scaffolds de Edge Functions.

---

## 2. Modelo de trabajo conjunto (¿dónde vive la base de datos?)

### Lo que ya está definido
- **Código:** repositorio de GitHub.
- **Base de datos:** **no vive en el repo**. El repo guarda el **esquema como código**
  (migraciones SQL en `supabase/migrations/`). La base **corre en la nube de Supabase**:
  el plan exige **dos proyectos Supabase hosteados — staging y producción**
  (`sprint-0-plan.md` §2.1). Todos los devs apuntan al proyecto compartido vía
  `SUPABASE_URL` + claves; las migraciones se aplican con la **Supabase CLI**.
- **Archivos (Storage):** también en Supabase cloud (buckets), no en el repo.
- **Secretos:** `.env.staging` / `.env.production` van en `.gitignore`; sólo se versiona `.env.example`.
- **Proceso de cambios:** flujo **RFC** ya definido en SDD_LOCK §4.

### Lo que falta definir (necesario para colaborar)
1. **No hay documento de flujo de desarrollo** (`CONTRIBUTING.md`). Sin definir:
   - **Entorno local por dev** (Supabase CLI local con Docker) vs compartir staging.
     *Recomendado:* cada dev con Supabase local; staging sólo para integración.
   - **Cómo se aplican las migraciones** (`supabase db push`, ¿CI?).
   - **Estrategia de ramas** (feature branches + PR, encaja con el RFC).
2. **Reparto de secretos**: al estar gitignoreados, hay que definir quién es dueño
   del proyecto Supabase y cómo se distribuyen las claves de forma segura.

### Propuesta
Agregar un `CONTRIBUTING.md` corto que fije: entorno local con Supabase CLI +
staging compartido para integración; migraciones versionadas aplicadas desde la
rama principal; feature branches + PR con revisión; y un canal seguro para secretos.

---

## 3. Inconsistencias del corpus

### 🔴 Graves (no catalogadas como GAP) → ver RFC-001

**G-1. El perfil del Tutor no tiene dónde guardarse.**
HU-002 exige nombre, teléfono, avatar y ubicación del Tutor, pero `users`
(`architecture/database.md` §3.1) no tiene esas columnas y no existe tabla `tutors`.
La búsqueda HU-016 usa `tutor.location`, que tampoco tiene origen. El `domain-map` §5
afirma la relación User→Location que el esquema no implementa. **Bloquea HU-002 (Sprint 1).**

**G-2. No hay dónde guardar las suscripciones push.**
Los flujos consultan `users.push_token` (`system-architecture.md` §6.2/§6.3), pero
esa columna no existe ni hay tabla de suscripciones. **Bloquea el canal push de
HU-009/012/014.**

> Raíz común: el esquema se bloqueó antes de validar que cubría todas las HU de
> Fase 1. Corrección propuesta en RFC-001 (aditiva y mínima).

### 🟠 Menores (documentales / técnicas)

1. **Buckets: 3 vs 4.** `technical-backlog.md` (S0-05 y entregables) dice 3 buckets y
   omite `avatars`; `sprint-0-plan.md` §2.4 dice 4 (incluye `avatars`). HU-002 necesita
   `avatars` → unificar en 4.
2. **Nombre del bucket de salud:** `health-records` (sprint-0-plan, system-architecture)
   vs `health_records` (database.md §4). Fijar uno.
3. **`day_of_week` no estándar:** database.md §3.7 define 0 = lunes, pero PostgreSQL
   (`EXTRACT(DOW)`) usa 0 = domingo → riesgo de off-by-one en disponibilidad (HU-017).
4. **Tabla fantasma `found_reports`:** system-architecture §6.1 dispara la Edge Function
   "en INSERT `found_reports`", pero esa tabla no existe (las encontradas van en
   `lost_reports` con `type='found'`). Error de rótulo.
5. **Resumen de severidad de GAPs mal sumado:** GAP_ANALYSIS dice "Alta 5 / Media 8",
   pero según su índice hay 6 Altas y 7 Medias (total 19 sí coincide).
6. **Cronograma vs roadmap:** los sprints suman ~11 semanas, pero el roadmap del SDD
   pone Fase 1 en meses 1–4 y Fase 2 en meses 5–9. Conviene alinear expectativas de fechas.

---

## Acciones propuestas para discutir

| # | Acción | Responsable sugerido |
|---|---|---|
| 1 | Aprobar/ajustar el reparto en 3 roles (sección 1) | Equipo |
| 2 | Crear `CONTRIBUTING.md` con el modelo de trabajo (sección 2) | Dev Lead |
| 3 | Revisar y aprobar **RFC-001** (perfil Tutor + push) | Dev Lead + equipo |
| 4 | Decidir las 4 decisiones de gaps del cierre de Sprint 0 (sprint-0-plan §4.3) | Equipo |
| 5 | Corregir inconsistencias menores 1–5 | Quien implemente Sprint 0 |
| 6 | Reconciliar cronograma de sprints con el roadmap (menor 6) | Dev Lead |
