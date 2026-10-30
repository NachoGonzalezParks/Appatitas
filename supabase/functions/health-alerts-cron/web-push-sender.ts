// Envío de Web Push cifrado desde la Edge Function (Sprint 2 · HU-009, Incremento 2).
//
// Usa `web-push-neo`: implementación edge-native (WebCrypto + fetch) que corre en el
// runtime Deno de Supabase y acepta las claves VAPID en base64url que ya tiene el
// proyecto (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY), sin conversiones.
//
// ⚠️ PENDIENTE DE VERIFICACIÓN EN STAGING (Día 5 del plan):
//   - El envío cifrado NO se puede probar en local (el Service Worker está apagado en
//     dev y hace falta una suscripción push real). Hay que probarlo end-to-end en
//     staging contra Android/iOS.
//   - `web-push-neo` está en una versión temprana (0.1.x); si diera problemas en el
//     runtime, evaluar `@negrel/webpush` (JSR) como alternativa.
// Si algo falla, degrada sin romper el cron (devuelve ok:false; el email ya salió).

import { sendNotification } from 'npm:web-push-neo@0.1.2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@bafri.app'

// ¿Están las claves VAPID cargadas? Si no, el cron saltea el canal push.
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE)
}

export interface PushSendResult {
  ok: boolean
  // true si el push service respondió 404/410: la suscripción ya no existe y
  // conviene borrarla (prune) de push_subscriptions.
  gone: boolean
}

export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: unknown,
): Promise<PushSendResult> {
  try {
    const res = await sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      {
        vapidDetails: {
          subject: VAPID_SUBJECT,
          publicKey: VAPID_PUBLIC!,
          privateKey: VAPID_PRIVATE!,
        },
      },
    )
    const status = res.statusCode
    return { ok: status >= 200 && status < 300, gone: status === 404 || status === 410 }
  } catch {
    // No romper el cron por un envío fallido: el email ya es el respaldo.
    return { ok: false, gone: false }
  }
}
