if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('[Main] Registering Service Worker...');
        
        navigator.serviceWorker.register('./sw.js')
        .then(function(registration) {
            console.log('[Main] SW registered successfully:', registration.scope);
            
            setTimeout(() => {
                caches.keys().then(cacheNames => {
                    console.log('[Main] Available caches:', cacheNames);
                    cacheNames.forEach(cacheName => {
                        caches.open(cacheName).then(cache => {
                            cache.keys().then(requests => {
                                console.log(`[Main] ${cacheName} contains:`, requests.length, 'items');
                            });
                        });
                    });
                });
            }, 1000);
        })
        .catch(function(error) {
            console.error('[Main] SW registration failed:', error);
        });
    });
    
    navigator.serviceWorker.ready.then(registration => {
        console.log('[Main] SW is ready and active');
    });
} else {
    console.warn('[Main] Service Workers not supported');
}