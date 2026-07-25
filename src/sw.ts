/// <reference lib="webworker" />
//
// Service Worker de APPATITAS (S0-06, Día 2).
// Sprint 0: SOLO infraestructura base — cache del shell offline + receptor de
// Web Push. No procesa lógica de negocio todavía; los payloads reales llegan en
// HU-009 (salud) y HU-012/014 (comunidad).
//
// Nota: este archivo se excluye de `tsconfig.json` a propósito (usa el lib
// "webworker", incompatible con el lib "DOM" del resto de la app). Vite lo
// compila por separado vía vite-plugin-pwa.

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

// --- Infraestructura Web Push (HU-009 · HU-012 · HU-014) ---
self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {}
  const title = payload.title ?? 'APPATITAS'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: payload.data ?? {},
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const focused = clientList.find((client) => 'focus' in client)
      if (focused) return focused.focus()
      return self.clients.openWindow(targetUrl)
    }),
  )
})
