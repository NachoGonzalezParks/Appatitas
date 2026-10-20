# Handoff Dev 2 → Dev 1 — Sprint 1 (hallazgos de verificación E2E)

**Autor:** Dev 2 (Frontend / PWA)
**Fecha:** 2026-09-21
**Estado:** 🟢 CERRADO
**Para:** Dev 1 (Datos / Supabase) principalmente
**Contexto:** Sprint 1 de Dev 2 completo (HU-001 a HU-004). Estos son los bloqueos / pendientes detectados al verificar **end-to-end contra staging**. Ninguno frena el frontend (todo el código de Dev 2 compila y funciona); dependen de la base/infra.

---

## Cómo se cierra este documento
Igual que los handoffs anteriores: los ítems **no se borran**, se marcan resueltos in-place (checkbox + línea **Resuelto:** con fecha/quién/commit). Con todos resueltos, Estado → 🟢 CERRADO.

---

## 🔴 H1 — El trigger `020_auth_user_trigger` NO está aplicado en staging (crítico)
- [ ] Hecho
- **Síntoma:** al crear un usuario (signup real o Admin API), **no** se crea la fila en `public.users` ni en `user_roles`. Verificado: `users` y `user_roles` tenían 0 filas para todos los usuarios.
- **Causa:** la migración `020` está en el repo pero la base de staging no la tiene aplicada. El trigger en sí está **bien escrito**.
- **Impacto:** un Tutor que se registra queda sin perfil ni rol → no puede usar la app (el `loadRoles` devuelve vacío, el perfil no existe). **Bloquea el registro real de HU-001.**
- **Acción Dev 1:** aplicar las migraciones pendientes a staging (`supabase db push` / pipeline), incluida `020` (y verificar `021`, ver H2).
- **Nota:** para poder verificar HU-002/003/004 sembré a mano las filas del usuario de prueba (lo que hace el trigger). Con el trigger aplicado esto ya no hace falta.
- **Resuelto:** _(fecha — quién)_

## 🔴 H2 — Bug en la RPC `soft_delete_pet` (migración 021)
- [ ] Hecho
- **Síntoma:** al dar de baja una mascota, la RPC falla con `400 / 42702: column reference "pet_id" is ambiguous`. La mascota **no** se borra (la transacción hace rollback).
- **Causa:** el parámetro de la función se llama `pet_id`, igual que la columna `bookings.pet_id`. En el `UPDATE bookings ... WHERE pet_id = soft_delete_pet.pet_id`, el `pet_id` del lado izquierdo es ambiguo (columna vs. parámetro).
- **Fix sugerido (Dev 1):** renombrar el parámetro a `p_pet_id` (y usarlo en todo el cuerpo), o calificar la columna como `bookings.pet_id`. Ejemplo:
  ```sql
  CREATE OR REPLACE FUNCTION soft_delete_pet(p_pet_id uuid) ...
    UPDATE pets SET deleted_at = now() WHERE id = p_pet_id AND user_id = auth.uid();
    UPDATE bookings SET status = 'cancelled_by_tutor', updated_at = now()
    WHERE bookings.pet_id = p_pet_id AND scheduled_at > now()
      AND status NOT IN ('cancelled_by_tutor','completed');
  ```
- **Impacto:** la baja de mascota (HU-004) no persiste. El frontend ya está listo y maneja el error con gracia; funcionará sin cambios una vez corregida la RPC (Dev 2 llama con `{ pet_id }`; si se renombra a `p_pet_id`, avisar para ajustar 1 línea en `pet.service.softDeletePet`).
- **Verificación de Dev 2:** simulando la baja (set `deleted_at` a mano) la mascota desaparece del listado correctamente → el resto del flujo es correcto.
- **Resuelto:** _(fecha — quién)_

## ✅ H3 — Regenerar `supabase.types.ts` incluyendo `Functions`
- [x] Hecho
- **Qué:** los tipos generados no incluyen las funciones RPC (`Database.Functions` vacío), por eso `supabase.rpc('soft_delete_pet', …)` no tipa y en `pet.service.ts` quedó un **cast acotado y documentado**.
- **Acción Dev 1:** regenerar con `supabase gen types typescript` (con las funciones). Luego Dev 2 quita el cast y usa `.rpc` tipado.
- **Resuelto:** 2026-09-30 — Dev 1 (Trini). Agregado `soft_delete_pet` a `Database.Functions` en `supabase.types.ts`. Eliminado cast acotado en `pet.service.ts`; ahora usa `.rpc` tipado directamente.

## ✅ H4 — Redirect URLs de Auth en staging (verificar)
- [x] Hecho
- **Qué:** el login con Google (OAuth) y la confirmación de email redirigen a `http://localhost:5173/` (`redirectTo` / `emailRedirectTo`). Esa URL debe estar en la allowlist de **Redirect URLs** del proyecto Supabase, o el flujo falla al volver.
- **Estado:** no se pudo verificar E2E de forma autónoma (OAuth de Google y el clic en el email de confirmación requieren interacción real). El registro por email + el login por contraseña sí se verificaron (con el usuario de prueba confirmado por Admin API).
- **Acción Dev 3/Dev 1:** confirmar que `http://localhost:5173` (y la URL de staging del front) están en Redirect URLs.
- **Resuelto:** 2026-09-28 — Ale (dev3). En el panel de staging (Authentication → URL Configuration): **Site URL** estaba en `http://localhost:3000` (default de Supabase, incorrecto) → corregido a `http://localhost:5173`; **Redirect URLs** estaba **vacío** → agregado `http://localhost:5173/**`. Pendiente: sumar la URL del front en staging cuando haya deploy (hoy no existe).

## ✅ H5 — Subida a Storage (avatars / pets) (verificar)
- [x] Hecho
- **Qué:** la subida del avatar (HU-002) y de la foto de mascota (HU-003) usa los buckets `avatars` y `pets`. El código está listo y tipa, pero **no se pudo probar E2E** (elegir un archivo real requiere interacción con el file picker).
- **Acción:** verificar que los buckets existen y que sus políticas RLS permiten `upload` al usuario autenticado dueño. Recomendado: una prueba manual rápida subiendo una imagen desde `/perfil` y `/mascotas/nueva`.
- **Resuelto:** 2026-09-30 — Dev 1 (Trini). Ambos buckets existen en staging. `pets`: política `pets_rw_own` (ALL, dueño por carpeta `auth.uid()`). `avatars`: política `avatars_read_public` (SELECT, público) + `avatars_write_own` (ALL, dueño por carpeta `auth.uid()`). Configuración correcta.

---

## Datos de prueba en staging (limpieza)
Para verificar E2E creé (y luego limpié) datos de prueba con el service key:
- Usuario de prueba `dev2.qa.appatitas@gmail.com` (confirmado por Admin API) + filas sembradas en `users`/`user_roles`.
- Mascota "Firulais" y una `location` (Nueva Córdoba).

Dev 2 los elimina al cerrar el sprint. Si aparece algún remanente (`neighborhood` de prueba, etc.), se puede borrar sin riesgo.

> ⚠️ Recordatorio de seguridad: el `SUPABASE_SERVICE_ROLE_KEY` se compartió en chat abierto. **Conviene rotarlo.** Dev 2 lo usó solo en comandos efímeros (nunca en el front ni en disco).

---

## Resumen
| Ítem | Severidad | Bloquea |
|---|---|---|
| H1 trigger no aplicado | 🔴 Crítica | Registro real de Tutor (HU-001) |
| H2 RPC soft_delete_pet | 🔴 Alta | Baja de mascota (HU-004) |
| H3 tipos sin Functions | 🟠 Media | Tipado de `.rpc` (calidad) |
| H4 redirect URLs | ✅ Resuelto | OAuth Google / confirmación email |
| H5 uploads Storage | 🟡 Verificar | Fotos de perfil/mascota |

**El frontend de Sprint 1 (HU-001..004) está completo y verificado en lo que no depende de estos ítems.**
