const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

const APP_SHELL_RESOURCES = [
    './',
    './index.html',
    './calendario.html',
    './formulario.html',
    './main.js',
    './manifest.json',
    './bootstrap.min.css',
    './bootstrap.min.js',
    './icons/icon-192x192.svg',
    './icons/icon-512x512.svg',
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
    
    // Handle app shell resources (core files)
    if (
        url.pathname === '/' ||
        url.pathname.endsWith('/') ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.includes('/icons/') ||
        url.pathname.endsWith('manifest.json') ||
        url.href.includes('fontawesome') ||
        url.href.includes('bootstrap')
    ) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('[App Shell] ✅ From cache:', request.url);
                        return response;
                    }
                    console.log('[App Shell] 🌐 Fetching:', request.url);
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
                            
                            // Return offline fallback for HTML pages
                            if (request.destination === 'document') {
                                return new Response(`
                                    <!DOCTYPE html>
                                    <html lang="es">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <title>Sin Conexión - PWA Calendar</title>
                                        <style>
                                            body { 
                                                font-family: Arial, sans-serif; 
                                                text-align: center; 
                                                padding: 50px; 
                                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                color: white;
                                                min-height: 100vh;
                                                margin: 0;
                                                display: flex;
                                                flex-direction: column;
                                                justify-content: center;
                                            }
                                            .offline-content {
                                                background: rgba(255,255,255,0.1);
                                                padding: 40px;
                                                border-radius: 10px;
                                                backdrop-filter: blur(10px);
                                            }
                                            button {
                                                background: #4f46e5;
                                                color: white;
                                                border: none;
                                                padding: 12px 24px;
                                                border-radius: 6px;
                                                cursor: pointer;
                                                margin-top: 20px;
                                                font-size: 16px;
                                            }
                                            button:hover {
                                                background: #3730a3;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="offline-content">
                                            <h1>📅 PWA Calendar</h1>
                                            <h2>Sin Conexión</h2>
                                            <p>Esta página no está disponible sin conexión.</p>
                                            <p>Por favor, verifica tu conexión a internet e intenta nuevamente.</p>
                                            <button onclick="window.location.reload()">Reintentar</button>
                                            <button onclick="window.history.back()">Volver</button>
                                        </div>
                                    </body>
                                    </html>
                                `, {
                                    headers: { 'Content-Type': 'text/html' }
                                });
                            }
                            
                            return new Response('Sin conexión', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
        return;
    }
    
    // Handle dynamic resources (external libraries, APIs)
    if (
        url.href.includes('fullcalendar') ||
        url.href.includes('select2') ||
        url.href.includes('jquery') ||
        url.href.includes('jsdelivr') ||
        url.href.includes('cdnjs') ||
        url.href.includes('googleapis') ||
        request.destination === 'script' ||
        request.destination === 'style'
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
    
    // Handle API calls and form submissions
    if (request.method !== 'GET') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    console.log('[Data] API call processed:', request.url);
                    return response;
                })
                .catch(error => {
                    console.log('[Data] API call failed offline:', request.url);
                    return new Response(JSON.stringify({
                        error: true,
                        message: 'Sin conexión - datos no sincronizados',
                        offline: true,
                        timestamp: new Date().toISOString()
                    }), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 503
                    });
                })
        );
        return;
    }
    
    // Default: try network first, then cache
    event.respondWith(
        fetch(request)
            .then(response => {
                console.log('[Default] Network response:', request.url);
                return response;
            })
            .catch(() => {
                console.log('[Default] Trying cache for:', request.url);
                return caches.match(request);
            })
    );
});