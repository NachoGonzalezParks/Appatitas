// Envío de Web Push cifrado, compartido por las Edge Functions (HU-009 / HU-012 / HU-014).
//
// Usa `web-push-neo`: implementación edge-native (WebCrypto + fetch) que corre en el
// runtime Deno de Supabase y acepta las claves VAPID en base64url que ya tiene el
// proyecto (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY), sin conversiones.
//
// ⚠️ PENDIENTE DE VERIFICACIÓN EN STAGING: el envío cifrado NO se puede probar en
// local (SW apagado en dev + hace falta una suscripción push real). `web-push-neo`
// está en versión temprana (0.1.x); si diera problemas, evaluar `@negrel/webpush`.
// Si algo falla, degrada sin romper al llamador.
//
// Lo usan: health-alerts-cron (Sprint 2) y las funciones de comunidad de Sprint 3
// (lost-pet-notify, found-pet-match).

import { sendNotification } from 'npm:web-push-neo@0.1.2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@bafri.app'

export interface PushSubscriptionKeys {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushSendResult {
  ok: boolean
  // true si el push service respondió 404/410: la suscripción ya no existe y
  // conviene borrarla (prune) de push_subscriptions.
  gone: boolean
}

// ¿Están las claves VAPID cargadas? Si no, el llamador debería saltear el push.
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE)
}

export async function sendPush(sub: PushSubscriptionKeys, payload: unknown): Promise<PushSendResult> {
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
    return { ok: false, gone: false }
  }
}
