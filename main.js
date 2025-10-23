// PWA Install functionality
let deferredPrompt;
let installButton;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('[Main] Registering Service Worker...');
        
        navigator.serviceWorker.register('./sw.js')
        .then(function(registration) {
            console.log('[Main] SW registered successfully:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
            
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

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[Main] PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

// Handle successful installation
window.addEventListener('appinstalled', (evt) => {
    console.log('[Main] PWA was installed successfully');
    hideInstallButton();
    showToast('¡App instalada correctamente!', 'success');
});

// Create install button
function showInstallButton() {
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.className = 'btn btn-success position-fixed';
        installButton.style.cssText = `
            bottom: 20px; 
            right: 20px; 
            z-index: 1000;
            border-radius: 50px;
            padding: 12px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        installButton.innerHTML = '<i class="fas fa-download me-2"></i>Instalar App';
        installButton.addEventListener('click', installPWA);
        document.body.appendChild(installButton);
    }
    installButton.style.display = 'block';
}

function hideInstallButton() {
    if (installButton) {
        installButton.style.display = 'none';
    }
}

// Install PWA function
async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[Main] Install prompt outcome:', outcome);
        deferredPrompt = null;
        hideInstallButton();
    }
}

// Show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'alert alert-info position-fixed';
    notification.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 1001;
        max-width: 300px;
    `;
    notification.innerHTML = `
        <strong>¡Actualización disponible!</strong><br>
        <small>Recarga la página para obtener la última versión.</small>
        <button class="btn btn-sm btn-primary ms-2" onclick="window.location.reload()">Recargar</button>
        <button class="btn btn-sm btn-secondary ms-1" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = `
        top: 20px; 
        left: 50%; 
        transform: translateX(-50%);
        z-index: 1002;
        max-width: 400px;
        text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Check if app is running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Initialize PWA features
document.addEventListener('DOMContentLoaded', function() {
    if (isPWA()) {
        console.log('[Main] Running as PWA');
        document.body.classList.add('pwa-mode');
    } else {
        console.log('[Main] Running in browser');
    }
    
    // Add offline indicator
    window.addEventListener('online', () => {
        showToast('Conexión restaurada', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('Sin conexión - Modo offline', 'warning');
    });
});