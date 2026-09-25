// Registro de Web Push del lado cliente (dev3 · HU-009 / HU-012 / HU-014).
//
// El Service Worker (src/sw.ts) ya RECIBE las push. Este módulo se encarga del
// otro extremo: pedir permiso, suscribir el navegador con la clave VAPID pública
// y guardar la suscripción en la tabla `push_subscriptions` para que las Edge
// Functions de notificaciones puedan enviarle a este dispositivo.
//
// Contrato de datos (migración 013 + RLS 015): cada usuario gestiona solo sus
// suscripciones (INSERT/SELECT/DELETE con user_id = auth.uid()). NO hay política
// de UPDATE, por eso al guardar usamos "insertar; si el endpoint ya existe, no
// hacer nada" en vez de un upsert que actualice.

import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type SubscribeResult =
  | { ok: true }
  | {
      ok: false
      reason: 'unsupported' | 'no-vapid-key' | 'no-session' | 'denied' | 'invalid-subscription' | 'db-error'
      detail?: string
    }

// ¿El navegador soporta lo necesario para Web Push?
export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Convierte la clave VAPID pública (base64url) al Uint8Array que espera
// pushManager.subscribe como applicationServerKey. Exportada para poder testearla.
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

// Pide permiso, suscribe el navegador y persiste la suscripción.
// Idempotente: si ya había una suscripción, reutiliza la existente y su fila.
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'no-vapid-key' }

  // Necesitamos el usuario para el user_id (y porque la RLS lo exige).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'no-session' }

  // Notification.requestPermission dispara el diálogo del navegador.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true, // requerido por Chrome: toda push debe mostrar una notificación
      // cast: la lib DOM tipa applicationServerKey como BufferSource<ArrayBuffer>;
      // el Uint8Array que generamos es compatible en runtime.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))

  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!p256dh || !auth) return { ok: false, reason: 'invalid-subscription' }

  // Insertar; si el endpoint ya existe, no hacer nada (RLS no permite UPDATE).
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint', ignoreDuplicates: true },
  )
  if (error) return { ok: false, reason: 'db-error', detail: error.message }

  return { ok: true }
}

// Desuscribe el navegador y borra la fila de este dispositivo.
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
