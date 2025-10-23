const APP_SHELL_CACHE = 'app-shell-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

const APP_SHELL_RESOURCES = [
    './',
    './index.html',
    './main.js',
    './manifest.json',
    './bootstrap.min.css',
    './bootstrap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then(cache => {
                console.log('[SW] Caching app shell resources:', APP_SHELL_RESOURCES);
                return cache.addAll(APP_SHELL_RESOURCES)
                    .then(() => {
                        console.log('[SW] All resources cached successfully');
                        return cache.keys();
                    })
                    .then(keys => {
                        console.log('[SW] Cached items:', keys.map(k => k.url));
                    });
            })
            .then(() => {
                console.log('[SW] App shell cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Error caching app shell:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== APP_SHELL_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Activated successfully');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (
        url.pathname === '/' ||
        url.pathname === '/CalendarCache/' ||
        url.pathname === '/CalendarCache/index.html' ||
        url.pathname === '/CalendarCache/main.js' ||
        url.pathname === '/CalendarCache/bootstrap.min.css' ||
        url.pathname === '/CalendarCache/bootstrap.min.js' ||
        url.pathname === '/CalendarCache/manifest.json' ||
        url.href.includes('fontawesome')
    ) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('[App Shell] ✅ From cache:', request.url);
                        return response;
                    }
                    console.warn('[App Shell] ❌ Not found, fetching:', request.url);
                    return fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                console.log('[App Shell] 📥 Adding to cache:', request.url);
                                const responseToCache = networkResponse.clone();
                                caches.open(APP_SHELL_CACHE)
                                    .then(cache => {
                                        cache.put(request, responseToCache);
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('[App Shell] 💥 Network failed:', request.url, error);
                            return new Response('<h1>Offline</h1><p>Esta página no está disponible sin conexión.</p>', {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        });
                })
        );
        return;
    }
    
    if (
        url.pathname === '/CalendarCache/calendario.html' ||
        url.pathname === '/CalendarCache/formulario.html' ||
        url.pathname === '/calendario.html' ||
        url.pathname === '/formulario.html' ||
        url.href.includes('fullcalendar') ||
        url.href.includes('select2') ||
        url.href.includes('jquery') ||
        url.href.includes('jsdelivr') ||
        url.href.includes('cdnjs')
    ) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('[Dynamic] ✅ From cache:', request.url);
                        return response;
                    }
                    
                    console.log('[Dynamic] 🌐 Fetching from network:', request.url);
                    return fetch(request)
                        .then(networkResponse => {
                            if (!networkResponse || networkResponse.status !== 200) {
                                return networkResponse;
                            }
                            
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    console.log('[Dynamic] 💾 Caching:', request.url);
                                    cache.put(request, responseToCache);
                                });
                            
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('[Dynamic] 💥 Network error:', error);
                            return caches.match(request);
                        });
                })
        );
        return;
    }
    
    // Para recursos de datos (POST, PUT, etc.) o localStorage APIs
    if (request.method !== 'GET') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    console.log('[Data] API call processed:', request.url);
                    return response;
                })
                .catch(error => {
                    console.log('[Data] API call failed offline:', request.url);
                    // Puedes retornar una respuesta offline personalizada aquí
                    return new Response(JSON.stringify({
                        error: true,
                        message: 'Sin conexión - datos no sincronizados',
                        offline: true
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
});