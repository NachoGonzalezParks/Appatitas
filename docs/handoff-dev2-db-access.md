# Handoff Dev 2 → Dev 1 — Acceso a la base de datos (local + staging)

**Autor:** Dev 2 (Frontend / PWA)
**Fecha:** 2026-08-11
**Estado:** 🟡 ABIERTO
**Para:** Dev 1 (Datos / Supabase)
**Relacionado:** [`docs/handoff-dev2-sprint0.md`](./handoff-dev2-sprint0.md) (D1-2, D1-3)

---

## Contexto

Dev 2 arranca **Sprint 1 (S0-06 → HU-001: registro/login)** y necesita **conectar la PWA a una base de datos real** para probar signup, sesión y los stores (`loadRoles`, `loadPets`).

Hoy Dev 2 **no puede conectar por ninguna de las dos vías**:
- **Local:** falta `supabase/config.toml` en el repo → `supabase start` no levanta el stack local.
- **Staging:** faltan las credenciales (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

Este handoff detalla lo que necesito de Dev 1 para destrabarlo. Alcanza con **una** de las dos vías para arrancar; lo ideal es la **local** (según `CONTRIBUTING.md §2`, cada dev corre Supabase local y staging queda para integración).

> **Nota de estado:** el archivo de tipos ya quedó conforme (handoff anterior **D1-1**, PR #25). Este documento cubre lo que falta para **correr** la BD, no los tipos.

---

## Cómo se cierra este documento

Igual que el handoff principal: los ítems **no se borran**, se marcan resueltos in-place.
1. Tildar el checkbox. 2. Completar **Resuelto:** (fecha — quién — commit/PR). 3. Emoji del ítem a ✅. 4. Con todos resueltos, Estado del encabezado a `🟢 CERRADO`.

---

## Vía A — Supabase local (recomendada)

### 🟡 DB-1 — Commitear `supabase/config.toml` ⭐ (bloqueo principal)
- [ ] Hecho
- **Qué falta:** el repo tiene `supabase/migrations`, `supabase/functions` y `supabase/seed`, pero **no** `supabase/config.toml`. Sin ese archivo, la Supabase CLI no puede inicializar el stack local (`supabase start` falla / no sabe puertos ni config de Auth).
- **Cómo:** generarlo con `supabase init` (si no existe) y **versionarlo** (debe ir al repo, no en `.gitignore`), con al menos esta config pensada para el equipo:
  ```toml
  project_id = "appatitas"

  [api]
  port = 54321
  schemas = ["public"]

  [db]
  port = 54322
  major_version = 15

  [studio]
  port = 54323

  [auth]
  site_url = "http://localhost:5173"
  additional_redirect_urls = ["http://localhost:5173"]

  [auth.email]
  enable_signup = true
  # Decisión a confirmar (ver DB-4): en local conviene enable_confirmations = false
  # para agilizar pruebas, o true leyendo los mails desde Inbucket (puerto 54324).
  enable_confirmations = false
  ```
- **Por qué el `site_url` y `additional_redirect_urls`:** la PWA corre en `http://localhost:5173`. Sin esto, las redirecciones de Auth (confirmación de email / OAuth) vuelven al default de Supabase (3000) y rompen el flujo de HU-001.
- **Criterio de aceptación:** con `config.toml` en el repo, cualquier dev puede correr `supabase start` sin configurar nada a mano.
- **Resuelto:** _(fecha — quién — commit/PR)_

### 🟡 DB-2 — Confirmar que `supabase db reset` aplica limpio (migraciones + seed)
- [ ] Hecho
- **Qué:** que `supabase start` + `supabase db reset` apliquen las migraciones `001 → 020` **y** el `seed/seed.sql` sin errores, dejando las 14 tablas + RLS + el trigger de registro (`020_auth_user_trigger.sql`) operativos en local.
- **Para qué:** que Dev 2 pueda registrar un usuario de prueba y ver el trigger poblar `users` + `user_roles`.
- **Cómo verificar (y dejar anotado el resultado):**
  ```bash
  supabase start
  supabase db reset
  # esperado: "Applying migration 001...020" + seed, sin errores
  ```
- **Criterio de aceptación:** `db reset` termina en verde; existen las 14 tablas en el esquema `public`.
- **Resuelto:** _(fecha — quién)_

---

## Vía B — Staging (alternativa, sin Docker)

### 🟡 DB-3 — Credenciales del proyecto Supabase de staging (= D1-2 del handoff anterior)
- [ ] Hecho
- **Qué:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto **staging** (valores anon/públicos; entregar por **canal seguro** del equipo, no en el chat abierto).
- **Para qué:** Dev 2 los carga en `.env.local` y conecta sin necesidad de Docker ni CLI. Cubre el criterio de S0-06 *"el cliente conecta al proyecto staging"*.
- **Formato de entrega (para pegar en `.env.local`):**
  ```bash
  VITE_SUPABASE_URL=https://<ref>.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key>
  ```
- **Resuelto:** _(fecha — quién — cómo se entregó)_

---

## Opcional / a definir

### 🟡 DB-4 — Estrategia de verificación de email + Google OAuth en local
- [ ] Hecho
- **Contexto:** HU-001 exige verificación de email (RN-004). En local, Supabase captura los mails en **Inbucket** (puerto 54324). Para Google OAuth en local hacen falta `client_id`/`client_secret` cargados vía variables de entorno de la CLI.
- **Qué necesito que Dev 1 (con Dev 3) defina:**
  1. ¿En local dejamos `enable_confirmations = false` (signup directo) o `true` leyendo el mail desde Inbucket?
  2. ¿Google OAuth se prueba en local (config extra) o queda solo para staging y en local usamos email/contraseña?
- **Nota:** no bloquea el arranque de S1-01 con email/contraseña; es para dejar el criterio claro.
- **Resuelto:** _(fecha — quién)_

---

## Definición de "listo para Dev 2"

Con **DB-1 + DB-2** (vía local) **o** **DB-3** (vía staging), Dev 2 puede:

```bash
# Local:
supabase start && supabase db reset
# crear .env.local con la URL/anon key (local: las imprime `supabase start`)
npm run dev
```

y verificar el camino completo de HU-001:
- [ ] La app arranca y conecta (sin errores de consola de Supabase).
- [ ] Signup con email/contraseña crea fila en `auth.users`.
- [ ] El trigger `020` puebla `public.users` + `user_roles` (role = `tutor`).
- [ ] `auth.store.loadRoles()` devuelve `['tutor']` y `activeRole = 'tutor'`.

---

## Resumen de bloqueo

| Ítem | Vía | Bloquea | Prioridad |
|---|---|---|---|
| DB-1 `config.toml` | Local | `supabase start` (todo el stack local) | **Alta** |
| DB-2 `db reset` limpio | Local | Datos reales en local | Alta |
| DB-3 keys staging | Staging | Conexión sin Docker | Alta (alternativa a DB-1/2) |
| DB-4 email/OAuth local | Ambas | Flujo completo de verificación (HU-001) | Media |

**Mínimo para que Dev 2 arranque Sprint 1:** DB-1 + DB-2 **o** DB-3.
