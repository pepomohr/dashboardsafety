// Service worker mínimo — habilita que la app sea instalable (PWA)
const CACHE = 'safety-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Network-first con fallback a caché (suficiente para el criterio de instalación)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// Notificaciones push (demo): muestra la notificación recibida
self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data ? event.data.json() : {} } catch { return {} } })()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Safety Services', {
      body: data.body || 'Tenés un documento próximo a vencer.',
      icon: '/icon.svg',
      badge: '/icon.svg',
    })
  )
})
