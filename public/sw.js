const CACHE_NAME = 'thibis-v1';
const OFFLINE_CACHE_SIZE = 20 * 1024 * 1024; // 20MB cache limit

const urlsToCache = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Check cache size before adding
              cache.keys().then((keys) => {
                if (keys.length > 100) { // Limit number of cached items
                  cache.delete(keys[0]); // Remove oldest item
                }
                cache.put(event.request, responseToCache);
              });
            });

          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          
          // Return a custom offline response for other requests
          return new Response(
            JSON.stringify({
              error: 'Sem conexão com a internet. Conecte-se ao WiFi ou compre dados móveis através da sua operadora.',
              offline: true,
              dataUsageExceeded: true
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            }
          );
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Monitor data usage and show notification when limit reached
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_DATA_USAGE') {
    // Simulate 20MB data usage check
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        let totalSize = 0;
        
        keys.forEach((request) => {
          cache.match(request).then((response) => {
            if (response) {
              response.blob().then((blob) => {
                totalSize += blob.size;
                
                if (totalSize > OFFLINE_CACHE_SIZE) {
                  // Send message back to main thread about data limit
                  event.ports[0].postMessage({
                    type: 'DATA_LIMIT_EXCEEDED',
                    message: 'Limite de 20MB atingido. Conecte-se ao WiFi ou compre dados móveis.'
                  });
                }
              });
            }
          });
        });
      });
    });
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova mensagem no Thibis',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver mensagem',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Thibis', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});