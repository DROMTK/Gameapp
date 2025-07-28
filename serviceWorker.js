// Service Worker for PlayMate App
// Handles offline functionality and caching

const CACHE_NAME = 'playmate-v1.0.0';
const STATIC_CACHE = 'playmate-static-v1.0.0';
const DYNAMIC_CACHE = 'playmate-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/games.html',
    '/app.js',
    '/games.js',
    '/assets/styles.css',
    '/manifest.json',
    // Game files
    '/games/word-search.html',
    '/games/memory-match.html',
    '/games/2048.html',
    '/games/color-match.html',
    '/games/math-quiz.html',
    '/games/platform-jump.html',
    '/games/typing-test.html',
    '/games/snake.html',
    '/games/maze-runner.html',
    '/games/brick-breaker.html',
    // External resources
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (url.origin === location.origin) {
        // Same-origin requests
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('Service Worker: Serving from cache', request.url);
                        return response;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // Cache successful responses
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return response;
                        })
                        .catch(error => {
                            console.error('Service Worker: Fetch failed', error);
                            // Return offline page for HTML requests
                            if (request.headers.get('accept').includes('text/html')) {
                                return caches.match('/index.html');
                            }
                        });
                })
        );
    } else {
        // Cross-origin requests (fonts, etc.)
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(DYNAMIC_CACHE)
                                    .then(cache => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return a fallback for failed cross-origin requests
                            if (request.url.includes('fonts.googleapis.com')) {
                                return new Response('', {
                                    status: 200,
                                    headers: { 'Content-Type': 'text/css' }
                                });
                            }
                        });
                })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle any background sync tasks here
            console.log('Service Worker: Background sync completed')
        );
    }
});

// Push notifications (if needed in the future)
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New game available!',
        icon: '/manifest.json',
        badge: '/manifest.json',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Play Now',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo='
            },
            {
                action: 'close',
                title: 'Close',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4IDZMMTYgNEwxMiA4TDggNEw2IDZMMTAgMTJMNCAxOEw2IDIwTDEyIDE0TDE4IDIwTDIwIDE4TDE0IDEyTDE4IDZaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPC9zdmc+Cg=='
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('PlayMate', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Error handling
self.addEventListener('error', event => {
    console.error('Service Worker: Error', event.error);
});

// Unhandled rejection
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled rejection', event.reason);
}); 