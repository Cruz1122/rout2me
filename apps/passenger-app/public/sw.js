/**
 * Service Worker para Rout2Me
 * Implementa caché offline y estrategias de caché para mejorar el rendimiento
 */

const CACHE_NAME = 'rout2me-v1';
const STATIC_CACHE_NAME = 'rout2me-static-v1';
const DYNAMIC_CACHE_NAME = 'rout2me-dynamic-v1';
const IMAGE_CACHE_NAME = 'rout2me-images-v1';
const TILE_CACHE_NAME = 'rout2me-tiles-v1';

// Recursos estáticos críticos
const STATIC_ASSETS = [
  '/',
  '/inicio',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/vite.svg',
];

// Patrones de URLs para diferentes tipos de recursos
const URL_PATTERNS = {
  static: /\.(js|css|html|json|svg|ico)$/,
  images: /\.(png|jpg|jpeg|gif|webp|svg)$/,
  tiles: /basemaps\.cartocdn\.com/,
  api: /\/api\//,
};

// Estrategias de caché por tipo de recurso
const CACHE_STRATEGIES = {
  static: 'cache-first',
  images: 'stale-while-revalidate',
  tiles: 'cache-first',
  api: 'network-first',
};

/**
 * Instalación del Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');

  event.waitUntil(
    Promise.all([
      // Crear caché para recursos estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Crear cachés para otros tipos de recursos
      caches.open(DYNAMIC_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME),
      caches.open(TILE_CACHE_NAME),
    ]).then(() => {
      console.log('Service Worker instalado correctamente');
      return self.skipWaiting();
    }),
  );
});

/**
 * Activación del Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activando...');

  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME &&
              cacheName !== TILE_CACHE_NAME
            ) {
              console.log('Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Tomar control de todas las páginas
      self.clients.claim(),
    ]),
  );
});

/**
 * Intercepta las peticiones de red
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar peticiones HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Excluir recursos que no deben ser cacheados
  if (shouldSkipCaching(request)) {
    return;
  }

  // Determinar el tipo de recurso
  const resourceType = getResourceType(request.url);
  const strategy = CACHE_STRATEGIES[resourceType] || 'cache-first';

  // Para tiles, usar estrategia más agresiva de caché
  if (resourceType === 'tiles') {
    event.respondWith(handleTileRequest(request));
    return;
  }

  // Aplicar estrategia de caché
  event.respondWith(handleRequest(request, strategy, resourceType));
});

/**
 * Determina si una petición debe ser omitida del caché
 */
function shouldSkipCaching(request) {
  const url = new URL(request.url);

  // Omitir conexiones WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return true;
  }

  // Omitir recursos de desarrollo (Vite)
  if (
    url.hostname === 'localhost' &&
    (url.port === '5173' || url.port === '3000')
  ) {
    return true;
  }

  // Omitir recursos de hot reload
  if (url.pathname.includes('__vite') || url.pathname.includes('__webpack')) {
    return true;
  }

  // Omitir peticiones POST, PUT, DELETE
  if (request.method !== 'GET') {
    return true;
  }

  // Omitir recursos muy grandes (>10MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return true;
  }

  return false;
}

/**
 * Maneja las peticiones según la estrategia de caché
 */
async function handleRequest(request, strategy, resourceType) {
  const cacheName = getCacheName(resourceType);

  try {
    let response;

    switch (strategy) {
      case 'cache-first':
        response = await cacheFirstStrategy(request, cacheName);
        break;

      case 'network-first':
        response = await networkFirstStrategy(request, cacheName);
        break;

      case 'stale-while-revalidate':
        response = await staleWhileRevalidateStrategy(request, cacheName);
        break;

      default:
        response = await cacheFirstStrategy(request, cacheName);
        break;
    }

    // Verificar que la respuesta es válida
    if (response && response instanceof Response) {
      return response;
    }

    // Si la respuesta no es válida, intentar fallback
    throw new Error('Respuesta inválida del caché');
  } catch (error) {
    console.error('Error en estrategia de caché:', error);

    // Fallback: intentar obtener del caché
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('Error al acceder al caché:', cacheError);
    }

    // Si no hay caché, devolver respuesta de error
    return new Response('Recurso no disponible offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Maneja peticiones de tiles con estrategia optimizada para offline
 */
async function handleTileRequest(request) {
  const cache = await caches.open(TILE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Si hay caché, devolverlo inmediatamente
  if (cachedResponse) {
    // Intentar actualizar en background (no bloqueante)
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Ignorar errores de actualización en background
      });

    return cachedResponse;
  }

  // Si no hay caché, intentar obtener de la red
  try {
    const networkResponse = await fetch(request);

    // Guardar en caché si la respuesta es válida
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Error al obtener tile de la red:', error);
    // Devolver respuesta vacía en lugar de error para que el mapa siga funcionando
    return new Response('', {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}

/**
 * Estrategia Cache First
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no está en caché, obtener de la red
  try {
    const networkResponse = await fetch(request);

    // Guardar en caché si la respuesta es válida
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Error al obtener recurso de la red:', error);
    return new Response('Recurso no disponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Estrategia Network First con mejor soporte offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Intentar obtener de la red primero con timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000),
      ),
    ]);

    if (networkResponse.ok) {
      // Guardar en caché
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Error de red, intentando caché:', error);

    // Si falla la red, intentar caché
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('Error al acceder al caché:', cacheError);
    }

    // Si no hay caché, devolver error solo si es crítico
    // Para recursos no críticos, devolver respuesta vacía
    const resourceType = getResourceType(request.url);
    if (resourceType === 'api') {
      return new Response('Recurso no disponible', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }

    // Para otros recursos, devolver respuesta vacía para no bloquear la app
    return new Response('', {
      status: 200,
      statusText: 'OK',
    });
  }
}

/**
 * Estrategia Stale While Revalidate
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Actualizar en background
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.warn('Error al actualizar en background:', error);
      return null; // Devolver null en caso de error
    });

  // Devolver caché inmediatamente si existe
  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no hay caché, esperar la respuesta de la red
  const networkResponse = await networkResponsePromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Si no hay respuesta de red, devolver error
  return new Response('Recurso no disponible', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * Determina el tipo de recurso basado en la URL
 */
function getResourceType(url) {
  if (URL_PATTERNS.static.test(url)) return 'static';
  if (URL_PATTERNS.images.test(url)) return 'images';
  if (URL_PATTERNS.tiles.test(url)) return 'tiles';
  if (URL_PATTERNS.api.test(url)) return 'api';
  return 'dynamic';
}

/**
 * Obtiene el nombre del caché según el tipo de recurso
 */
function getCacheName(resourceType) {
  switch (resourceType) {
    case 'static':
      return STATIC_CACHE_NAME;
    case 'images':
      return IMAGE_CACHE_NAME;
    case 'tiles':
      return TILE_CACHE_NAME;
    case 'api':
      return DYNAMIC_CACHE_NAME;
    default:
      return DYNAMIC_CACHE_NAME;
  }
}

/**
 * Limpia cachés antiguos
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [
    STATIC_CACHE_NAME,
    DYNAMIC_CACHE_NAME,
    IMAGE_CACHE_NAME,
    TILE_CACHE_NAME,
  ];

  const deletePromises = cacheNames
    .filter((cacheName) => !currentCaches.includes(cacheName))
    .map((cacheName) => caches.delete(cacheName));

  await Promise.all(deletePromises);
}

/**
 * Maneja mensajes del cliente
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAN_CACHE':
      cleanupOldCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;
  }
});

/**
 * Obtiene el tamaño total del caché
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
