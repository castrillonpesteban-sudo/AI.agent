const CACHE_NAME = 'asistente-personal-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/tareas',
  '/dudas',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // addAll falla entero si una URL falla; se piden una a una para no romper la instalación.
      .then((cache) => Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // El estado del asistente nunca se sirve de caché: siempre a la red.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copia = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});

// --- Recordatorios ---------------------------------------------------------

self.addEventListener('push', (event) => {
  let aviso = { titulo: 'Recordatorio', cuerpo: '', url: '/tareas', etiqueta: 'recordatorio' };

  if (event.data) {
    try {
      aviso = { ...aviso, ...event.data.json() };
    } catch {
      aviso.cuerpo = event.data.text();
    }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(aviso.titulo, {
        body: aviso.cuerpo,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: aviso.etiqueta,
        renotify: true,
        data: { url: aviso.url },
      }),
      // Si la app está abierta, que refresque el hilo al instante.
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
        for (const cliente of clientes) {
          cliente.postMessage({ tipo: 'recordatorio' });
        }
      }),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || '/tareas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      for (const cliente of clientes) {
        if ('focus' in cliente) {
          cliente.navigate?.(destino);
          return cliente.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
