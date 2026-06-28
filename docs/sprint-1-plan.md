# Sprint 1 — Identidad y Perfiles Base
**Fuente:** `docs/technical-backlog.md` · `docs/SDD_MASTER.md` v1.1
**Duración estimada:** 2 semanas
**Bounded Contexts:** BC-01 (Identidad y Acceso) · BC-02 (Gestión de Perfiles — núcleo)
**HU cubiertas:** HU-001 · HU-002 · HU-003 · HU-004

Sin este sprint no existe ningún actor en el sistema. Sin mascota registrada no existe el Pasaporte de Salud ni los reportes de pérdida. Es el sprint de mayor efecto de cascada hacia adelante.

---

## 1. Impact Analysis

### 1.1 Qué desbloquea Sprint 1

| Tarea | Desbloquea directamente |
|---|---|
| **S1-01** Registro y auth de Tutor | S1-02, S1-03, Sprint 2 completo, Sprint 3 (reportes autenticados) |
| **S1-02** Perfil de Tutor con ubicación | S5-01 (origen geoespacial de búsqueda) |
| **S1-03** Registro de Mascota | S2-01, S2-02, S2-03, S2-05, S3-01 |
| **S1-04** Edición y baja lógica | Independiente, cierra HU-004 |

### 1.2 Dependencias previas requeridas

- Sprint 0 completo y verificado.
- Tabla `users` existente con columnas `id`, `email`, `role`, `email_verified`.
- Tabla `pets` existente con `deleted_at`.
- Tabla `locations` existente con índice GIST.
- Tabla `bookings` existente (para la cascada de S1-04, aunque sin datos).
- Bucket `pets` en Storage con política de escritura por propietario.
- Bucket `avatars` en Storage.
- Supabase Auth configurado con los tres proveedores.
- Resend con dominio verificado y función utilitaria operativa.

### 1.3 Reglas de negocio activas en este sprint

| RN | Descripción | Tarea |
|---|---|---|
| RN-004 | Verificación de email obligatoria antes de acceso completo | S1-01 |
| RN-005 | Email único en el sistema | S1-01 |
| RN-003 | Eliminación lógica de mascota con cascada de reservas | S1-04 |
| RN-016 | Sin límite de mascotas por Tutor en Fase 1 | S1-03 |
| RN-024 | Una única foto por mascota | S1-03 |

### 1.4 Gaps activos en este sprint

| GAP | Descripción | Impacto en el sprint | Decisión provisional |
|---|---|---|---|
| GAP-004 | Rol único vs múltiple por usuario | ✅ Resuelto por RFC-002 | Roles en tabla `user_roles` (1:N). El registro inserta el rol elegido; un usuario puede acumular `tutor` + `provider`. La UI requiere un selector de "rol activo". |
| GAP-006 | Dependencia de Fase 2 en HU-004 | S1-04: la cascada sobre `bookings` debe no fallar si no hay reservas | La query de cascada debe ejecutarse con `WHERE scheduled_at > now()` y no fallar en tabla vacía. |

### 1.5 Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Facebook OAuth no aprobado por Meta al iniciar Sprint 1 | Alta | Medio — HU-001 queda sin un provider OAuth | Lanzar con Google + email/contraseña. Facebook se activa cuando llegue la aprobación sin cambios de código. |
| Listado de barrios de Córdoba no disponible | Media | Alto — HU-002 no puede tener selector asistido | Preparar el listado (Córdoba Capital + Gran Córdoba) antes del día 1 de este sprint. |
| Trigger Auth→users con race condition | Baja | Alto — usuario autenticado sin fila en `public.users` | Usar Supabase Database Webhook o trigger `on auth.users insert` para garantizar atomicidad. |
| RLS no definida aún (GAP-014) | Alta | Medio en staging | Operar con RLS permisiva documentada. Definir políticas reales al cierre de este sprint. |

---

## 2. Diseño Técnico

### 2.1 S1-01 — Registro y autenticación de Tutor (HU-001)

**Flujo completo:**

```
Visitante llega a la app
  → Pantalla de selección de rol (rol elegido en el onboarding)
      ├── "Soy dueño de mascota"  → user_roles: role = 'tutor'
      └── "Ofrezco servicios"     → user_roles: role = 'provider'  (Sprint 4)

Tutor selecciona método:
  ├── Email/contraseña
  │     → supabase.auth.signUp({ email, password, options: { data: { role } } })
  │     → Supabase envía email de verificación (vía Resend SMTP)
  │     → Pantalla: "Revisá tu email"
  │     → Usuario hace clic en enlace → email_verified = true
  │     → Trigger INSERT en public.users + INSERT en user_roles(role)  (RFC-002)
  │
  ├── OAuth Google
  │     → supabase.auth.signInWithOAuth({ provider: 'google' })
  │     → Redirect → callback → Trigger INSERT en public.users + user_roles
  │
  └── OAuth Facebook
        → supabase.auth.signInWithOAuth({ provider: 'facebook' })
        → (idem Google)
```

**Trigger en base de datos (ejecutar en Sprint 0, verificar aquí):**

Función que se dispara en `INSERT ON auth.users` y crea la fila en `public.users` **y** la fila de rol en `user_roles` (RFC-002). El rol elegido se pasa como metadata (`options.data.role`) en el signup. El rol `admin` nunca se asigna por esta vía. Un usuario que ya existe y suma un rol (ej: Tutor que se hace Proveedor en HU-005) agrega una fila a `user_roles` sin duplicar (PK compuesta).

**Guard de rutas:**

Toda ruta privada valida:
1. `session` existe (usuario autenticado).
2. `email_verified = true` (RN-004).
3. Si no → redirect a `/verificar-email`.

---

### 2.2 S1-02 — Perfil de Tutor (HU-002)

**Flujo de datos:**

```
Tutor autenticado accede a /perfil
  → Si perfil incompleto: banner de porcentaje visible

Campos del formulario:
  - nombre_completo     → UPDATE users.nombre
  - telefono (opcional) → UPDATE users.telefono
  - barrio/zona         → INSERT locations (neighborhood, city='Córdoba')
                          UPDATE users.location_id = locations.id
  - avatar              → Storage upload → avatars/{user_id}/avatar.{ext}
                          UPDATE users.avatar_url

Porcentaje de completitud:
  - nombre_completo: 30%
  - ubicación: 40%
  - avatar: 20%
  - teléfono: 10%
  → Banner desaparece al llegar a 100%
```

**Nota crítica:** `locations.coordinates` de HU-002 es el punto de origen para `ST_DWithin` en HU-016 (Sprint 5). El barrio/zona debe convertirse a coordenadas. Opciones: usar un mapa de centroides de barrios precargado, o usar la Geolocation API en el momento del completar perfil.

---

### 2.3 S1-03 — Registro de Mascota (HU-003)

**INSERT en `pets`:**

```
{
  user_id:      auth.user.id,
  name:         form.name,
  species:      form.species,       -- 'perro' | 'gato' | 'otro'
  breed:        form.breed,
  birth_date:   form.birth_date,
  sex:          form.sex,
  weight_kg:    form.weight_kg,
  color_marks:  form.color_marks,   -- nullable
  microchip_id: form.microchip_id,  -- nullable
  photo_url:    null,               -- se actualiza tras upload
  deleted_at:   null
}
```

**Upload de foto (RN-024 — una sola foto):**
```
ruta en Storage: pets/{pet_id}/photo.{ext}
→ Si ya existe foto anterior: reemplazar (no acumular)
→ UPDATE pets.photo_url = nueva_url
```

---

### 2.4 S1-04 — Edición y baja lógica de Mascota (HU-004)

**Edición:** UPDATE sobre cualquier campo de `pets` excepto `id`, `user_id`, `created_at`.

**Baja lógica (RN-003):**

```
Tutor confirma baja de mascota
  → Transacción atómica:
      1. UPDATE pets SET deleted_at = now() WHERE id = {pet_id}
      2. UPDATE bookings
         SET status = 'cancelled_by_tutor'
         WHERE pet_id = {pet_id}
           AND scheduled_at > now()
           AND status NOT IN ('cancelled_by_tutor', 'completed')
  → Si la transacción falla: rollback completo
  → La mascota con deleted_at IS NOT NULL no aparece en ninguna lista
```

**Regla de filtrado universal:** toda query sobre `pets` debe incluir `WHERE deleted_at IS NULL` excepto consultas administrativas.

---

### 2.5 RLS — Primer conjunto de políticas (cierre de Sprint 1)

Definir antes de avanzar a Sprint 2:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `users` | Solo propio `id` | Solo via trigger Auth | Solo propio `id` | Nunca |
| `user_roles` | Solo propio `user_id` | `tutor`/`provider`: propio; `admin`: solo otro admin | Nunca (se borra+inserta) | Solo admin |
| `pets` | Solo `user_id = auth.uid()` | Solo `user_id = auth.uid()` | Solo `user_id = auth.uid()` | Nunca |
| `locations` | Pública (lectura) | Autenticado | Solo el propietario indirecto | Nunca |

Se define la función `has_role(uid, r)` (RFC-002) para los chequeos de rol en RLS de todas las tablas. `admin_audit_log` (RFC-003) se crea en Sprint 0; su RLS (solo INSERT, lectura admin) puede fijarse aquí o al introducir el módulo Admin.

---

## 3. Archivos nuevos en este sprint

```
src/
├── bc01-identity/
│   ├── pages/
│   │   ├── RegisterPage.vue          — HU-001: selección de rol + formularios
│   │   ├── LoginPage.vue             — HU-001: login
│   │   └── EmailVerifyPage.vue       — HU-001: pantalla de verificación pendiente
│   ├── components/
│   │   ├── RoleSelectorForm.vue      — "Tutor" / "Proveedor"
│   │   ├── EmailPasswordForm.vue
│   │   └── OAuthButtons.vue          — Google + Facebook
│   └── services/
│       └── auth.service.ts           — signUp, signIn, signOut, getSession
│
├── bc02-profiles/
│   ├── pages/
│   │   ├── TutorProfilePage.vue      — HU-002
│   │   ├── PetListPage.vue           — HU-003/004: lista de mascotas
│   │   └── PetFormPage.vue           — HU-003/004: crear y editar
│   ├── components/
│   │   ├── ProfileBanner.vue         — Banner de progreso (HU-002)
│   │   ├── PetCard.vue               — Tarjeta de mascota en lista
│   │   ├── PhotoUploader.vue         — Upload genérico reutilizable
│   │   └── ConfirmDeleteModal.vue    — Confirmación de baja
│   └── services/
│       ├── tutor.service.ts          — updateProfile, uploadAvatar
│       └── pet.service.ts            — create, update, softDelete, list
│
├── router/
│   ├── index.ts                      — Rutas públicas y privadas
│   └── guards.ts                     — authGuard + emailVerifiedGuard
│
└── stores/
    ├── auth.store.ts                 — session, user, roles[], activeRole
    └── pet.store.ts                  — activePet, petList

supabase/
└── migrations/
    └── 0016_rls_sprint1.sql          — Políticas RLS de users, user_roles y pets + función has_role()
```

---

## 4. Plan de implementación

### Secuencia por día

```
DÍA 1
├── Dev 1: Trigger Auth→public.users + RLS permisiva temporal
│          Verificar que el trigger funciona con los 3 providers
└── Dev 2: RoleSelectorForm + EmailPasswordForm
           Integración supabase.auth.signUp con metadata de rol

DÍA 2
├── Dev 1: Política RLS users (SELECT propio id)
│          Política RLS pets (todos los campos por user_id)
└── Dev 2: OAuthButtons (Google live, Facebook pendiente)
           EmailVerifyPage + guard emailVerified
           LoginPage con manejo de errores

DÍA 3
├── Dev 1: authGuard en router + stores auth.store.ts
│          Verificar flujo completo de registro en staging
└── Dev 2: TutorProfilePage (formulario + banner de progreso)
           Integración con selector de barrios de Córdoba

DÍA 4
├── Dev 1: pet.store.ts + petList con filtro deleted_at IS NULL
│          Verificar que softDelete no rompe queries existentes
└── Dev 2: PetListPage + PetFormPage (create)
           PhotoUploader → bucket pets

DÍA 5
├── Dev 1: Transacción atómica de baja lógica (Supabase RPC)
│          Cascada sobre bookings (no debe fallar con tabla vacía)
└── Dev 2: PetFormPage (edit) + ConfirmDeleteModal
           Integración con la RPC de baja lógica

DÍA 6-7
└── Integración, pruebas en staging, correcciones
    Dev 3: Activar Facebook OAuth cuando llegue aprobación de Meta
           Verificar email de verificación llegando vía Resend
```

### Criterios de aceptación del Sprint 1

- [ ] Un visitante puede registrarse con email/contraseña y recibir el email de verificación.
- [ ] Un visitante puede registrarse con Google OAuth.
- [ ] Sin verificar email, el acceso a rutas privadas está bloqueado.
- [ ] Un Tutor puede completar su perfil con nombre, barrio y avatar.
- [ ] El banner de progreso refleja el porcentaje correcto y desaparece al 100%.
- [ ] Un Tutor puede registrar una mascota con foto.
- [ ] Una mascota dada de baja no aparece en la lista pero existe en la BD con `deleted_at`.
- [ ] La cascada de baja sobre `bookings` no falla con tabla vacía.
- [ ] Las políticas RLS de `users` y `pets` están activas en staging.
- [ ] Todas las rutas privadas redirigen a login si no hay sesión.
