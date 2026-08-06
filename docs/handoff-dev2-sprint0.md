# Handoff Dev 2 → Dev 1 / Dev 3 — Sprint 0

**Autor:** Dev 2 (Frontend / PWA)
**Fecha:** 2026-08-05
**Estado:** 🟡 ABIERTO
**Alcance:** dependencias que Dev 2 necesita de Dev 1 y Dev 3 para cerrar Sprint 0 (S0-06) y habilitar Sprint 1.

---

## Cómo se cierra este documento

Cuando un ítem se resuelve, **no se borra**: se marca resuelto in-place para conservar la trazabilidad (igual que `GAP_ANALYSIS.md` y los RFC).

1. Tildar el/los checkbox del ítem.
2. Completar la línea **Resuelto:** con fecha + quién + cómo (commit/PR o dato provisto).
3. Cambiar el emoji del ítem a ✅ en el título.
4. Cuando **todos** los ítems estén resueltos, cambiar el **Estado** del encabezado a `🟢 CERRADO`.

Borrarlo solo si el equipo decide archivarlo → mover a `docs/archive/`, nunca eliminar.

---

## Estado de Dev 2 al momento del handoff

**S0-06 (PWA) — completo del lado de Dev 2:**
- Scaffold PWA (Vue 3 + TS + Vite), estructura por Bounded Context, router con rutas públicas/privadas.
- Web App Manifest + Service Worker (offline shell + receptor de push).
- Guard de autenticación funcional (rutas privadas → `/login`).
- Cliente Supabase cableado (arranca contra Supabase local por defecto).
- Tipos de entidad integrados desde `supabase.types.ts` (Pet = Row, UserRole).

**Verificado:** `type-check` y `build` en verde; guard probado en navegador.

**Lo que sigue bloqueado depende de los ítems de abajo.**

---

## Pedidos a Dev 1 (Datos)

### 🟡 D1-1 — Regenerar `src/shared/types/supabase.types.ts` en formato conforme a supabase-js
- [ ] Hecho
- **Por qué:** el archivo actual está escrito a mano y no es válido para el cliente tipado. Al hacer `createClient<Database>()`, **todas** las queries colapsan a `never` (falla `type-check`).
- **Qué falta concretamente:**
  - En `public`: agregar `Views`, `Functions`, `Enums`, `CompositeTypes` (aunque vayan vacías, p. ej. `Views: { [_ in never]: never }`).
  - En **cada tabla**: agregar `Relationships: []`.
  - En las tablas inmutables: `Update: never` → objeto (partial de columnas), como emite la codegen oficial.
- **Cómo (recomendado):** dejar que la CLI genere el formato correcto:
  ```bash
  supabase gen types typescript --local > src/shared/types/supabase.types.ts
  # o: supabase gen types typescript --project-id <ref> > src/shared/types/supabase.types.ts
  ```
- **Bloquea:** cliente Supabase tipado (queries type-safe). Referencia: `TODO(Dev1 · S0-01)` en `src/lib/supabase.ts`.
- **Resuelto:** _(fecha — quién — commit/PR)_

### 🟡 D1-2 — Credenciales del proyecto Supabase de **staging**
- [ ] Hecho
- **Qué:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de staging (valores anon/públicos; compartir por canal seguro del equipo, no por el chat abierto).
- **Para qué:** cargar `.env.local` y cumplir el criterio de S0-06 *"el cliente conecta al proyecto staging"* + probar login real.
- **Bloquea:** verificación de conexión real (hoy la app cae a Supabase local por defecto).
- **Resuelto:** _(fecha — quién — cómo se entregó)_

### 🟡 D1-3 — Confirmar que las migraciones corren en local (Supabase CLI)
- [ ] Hecho
- **Qué:** que `supabase start` + `supabase db reset` aplican las 14 tablas sin error.
- **Para qué:** correr la PWA contra una BD local real y probar `loadPets()` / `loadRoles()` sin depender de staging.
- **Resuelto:** _(fecha — quién)_

---

## Pedidos a Dev 3 (Plataforma / Integraciones)

### 🟡 D3-1 — Supabase Auth habilitado
- [ ] Hecho
- **Qué:** email/contraseña + Google OAuth activados en el proyecto (Facebook puede quedar pendiente de Meta).
- **Para qué:** `initAuth()` / `getSession()` y el login de Sprint 1 necesitan Auth encendida. Hoy el guard funciona pero nunca hay sesión.
- **Resuelto:** _(fecha — quién)_

### 🟡 D3-2 — Contrato del trigger `Auth → public.users + user_roles` ⭐
- [ ] Hecho
- **Por qué:** es el contrato Dev2↔Dev3 del registro (Sprint 1, HU-001). El `auth.store` de Dev 2 hace `loadRoles()` leyendo `user_roles`; si el rol no se inserta con la clave esperada, el usuario queda sin rol.
- **Qué necesito confirmar por escrito:**
  1. ¿El trigger inserta en `public.users` **y** en `user_roles` al registrarse el usuario?
  2. ¿De qué campo del metadata toma el rol? (p. ej. `raw_user_meta_data->>'role'`). Dev 2 en el signup manda `options: { data: { role } }` → necesito el **nombre exacto** de la clave.
  3. ¿Qué rol asigna por defecto si no viene metadata?
- **Respuesta de Dev 3 (completar acá):**
  > 1. …
  > 2. clave del metadata = `…`
  > 3. rol por defecto = `…`
- **Resuelto:** _(fecha — quién)_

### 🟡 D3-3 — Clave pública VAPID
- [ ] Hecho
- **Qué:** `VITE_VAPID_PUBLIC_KEY` (la privada queda solo en las Edge Functions).
- **Para qué:** suscribir el navegador a Web Push. No bloquea Sprint 0; necesaria para Sprint 2 (HU-009/012/014) y va en el `.env`.
- **Resuelto:** _(fecha — quién)_

---

## Resumen de bloqueo

| Ítem | Dueño | Bloquea | Prioridad |
|---|---|---|---|
| D1-1 tipos conformes | Dev 1 | Cliente tipado (cierra integración de tipos) | Alta |
| D1-2 keys staging | Dev 1 | Criterio "conecta a staging" de S0-06 | Alta |
| D1-3 migraciones locales | Dev 1 | Pruebas contra BD local | Media |
| D3-1 Auth habilitado | Dev 3 | Login real / arranque de Sprint 1 | Alta |
| D3-2 contrato del trigger | Dev 3 | Registro de HU-001 (Sprint 1) | Alta (acordar ya) |
| D3-3 VAPID | Dev 3 | Web Push (Sprint 2) | Baja |

**Para cerrar Sprint 0:** D1-1, D1-2 y D3-1.
**Acordar por escrito cuanto antes:** D3-2 (define cómo Dev 2 y Dev 3 se enganchan en el registro).
