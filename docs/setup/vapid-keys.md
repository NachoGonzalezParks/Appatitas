# Claves VAPID — Notificaciones Push

**Responsable:** dev3 (Integraciones · Web Push)
**Usadas por:** HU-009 (alertas de salud), HU-012 (mascota perdida), HU-014 (match de encontrada).

## Qué son (explicación no técnica)

Las claves VAPID son el **"documento de identidad" de nuestra app** para poder enviar
notificaciones push (esos avisos que aparecen en el celular aunque la app esté cerrada).

Los navegadores no dejan que cualquier servidor mande avisos: exigen que estén **firmados**.
Por eso hay un **par de claves**:

- **Clave pública:** identifica a APPATITAS ante el navegador cuando el usuario acepta recibir
  avisos. Va en el cliente (la PWA).
- **Clave privada:** firma cada envío desde el servidor. Vive solo en el servidor (Edge Functions).

Se generan **una sola vez** (con `web-push generate-vapid-keys`) y ya están generadas para el proyecto.

## Dónde viven

| Clave | Variable de entorno | Dónde |
|---|---|---|
| Pública | `VITE_VAPID_PUBLIC_KEY` | Cliente (PWA) — no secreta |
| Privada | `VAPID_PRIVATE_KEY` | Solo servidor (Edge Functions) — **secreta** |

Los valores reales están en `.env.local` (que **no se commitea**) y, para producción, se cargan
como *secrets* en Supabase. **Nunca** van al repositorio.

## ⚠️ Tres cosas importantes

1. **La pública NO es secreta, la privada SÍ.** La privada nunca se comparte ni se commitea.
   Al desplegar las Edge Functions se carga como *secret* en Supabase (`supabase secrets set`).
2. **Son "para siempre".** La clave pública queda "grabada" en la suscripción de cada usuario.
   Si se regeneran, **se rompen todas las suscripciones existentes**. Se generan una vez y se usan
   **las mismas en todo el equipo y en todos los entornos** (staging y producción).
3. **Se comparten por canal seguro** (el mismo que las claves de Supabase), para que **todos los
   desarrolladores** tengan la misma pública, y quien despliega las funciones tenga la privada.
   No se mandan por el repositorio.
