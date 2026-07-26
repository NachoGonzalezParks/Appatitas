/// <reference lib="webworker" />
//
// Service Worker de APPATITAS.
// - S0-06 (Nacho): cache del shell offline + receptor base de Web Push.
// - dev3: lógica de Web Push (recepción, click y snooze) para HU-009 (alertas
//   de salud), HU-012 (mascota perdida) y HU-014 (match de encontrada).
//
// Nota: este archivo se excluye de `tsconfig.json` a propósito (usa el lib
// "webworker", incompatible con el lib "DOM" del resto de la app). Vite lo
// compila por separado vía vite-plugin-pwa (injectManifest).

declare const self: ServiceWorkerGlobalScope

const SHELL_CACHE = 'appatitas-shell-v1'
const OFFLINE_URL = '/'

// Cachea el shell al instalar y activa de inmediato.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

// Limpia caches viejos y toma control de las pestañas abiertas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Network-first para navegación; si no hay red, sirve el shell cacheado.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
    ),
  )
})

// --- Web Push (HU-009 · HU-012 · HU-014) ------------------------------------

// Contrato del payload que envían las Edge Functions de notificaciones.
// Ver docs/sprint-2-plan.md §2.4 (alertas de salud) y system-architecture §8.
interface PushPayload {
  title?: string
  body?: string
  // Ruta de la PWA a abrir al tocar la notificación (la define el emisor).
  url?: string
  // Tipo de aviso: decide las acciones y el agrupado de la notificación.
  type?: 'health' | 'lost_pet' | 'found_match'
  // Datos de negocio (p. ej. `record_id` para el snooze de salud).
  data?: Record<string, unknown>
}

const SNOOZE_ACTION = 'snooze'

self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    // Payload malformado o texto plano: no romper el SW.
    payload = { body: event.data?.text() }
  }

  const title = payload.title ?? 'APPATITAS'
  const recordId = payload.data?.record_id as string | undefined

  // Solo las alertas de salud ofrecen "Posponer 7 días" (RN-007).
  const actions =
    payload.type === 'health' && recordId
      ? [
          { action: SNOOZE_ACTION, title: 'Posponer 7 días' },
          { action: 'open', title: 'Ver' },
        ]
      : []

  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    // Guardamos lo necesario para resolver el click.
    data: { url: payload.url, type: payload.type, ...payload.data },
    // Agrupa avisos del mismo registro y evita apilar duplicados.
    tag: recordId ? `health-${recordId}` : undefined,
    renotify: Boolean(recordId),
    // Las alertas de salud quedan fijas hasta que el Tutor interactúe.
    requireInteraction: payload.type === 'health',
    actions,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as Record<string, unknown>
  const url = (data.url as string | undefined) ?? '/'

  if (event.action === SNOOZE_ACTION) {
    event.waitUntil(snoozeHealthRecord(data.record_id as string | undefined, url))
    return
  }

  event.waitUntil(openApp(url))
})

// Posponer +7 días una alerta de salud (RN-007).
//
// El UPDATE real (`next_due_date += 7 días`) es una RPC de Supabase de Sprint 2
// (área de Dev1). Desde el SW no tenemos la sesión autenticada del Tutor, así que
// delegamos en la app: si hay una pestaña abierta le mandamos un mensaje para que
// ejecute el snooze con su cliente Supabase.
async function snoozeHealthRecord(recordId: string | undefined, url: string) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  if (recordId && clients.length > 0) {
    clients[0].postMessage({ type: 'snooze-health-record', recordId })
    return (clients[0] as WindowClient).focus()
  }

  // TODO(Sprint 2 · HU-009): si la app está cerrada, abrir una ruta que dispare
  // el snooze automáticamente (a coordinar con Dev2). Por ahora abre la app.
  return self.clients.openWindow(url)
}

// Enfoca una pestaña existente de la app o abre una nueva en `url`.
async function openApp(url: string) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const focused = clients.find((client) => 'focus' in client) as WindowClient | undefined
  if (focused) return focused.focus()
  return self.clients.openWindow(url)
}
