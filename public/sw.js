// This is a basic service worker to enable PWA functionality.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // The service worker is installed.
  // You can pre-cache assets here if needed.
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // The service worker is activated.
  // You can clean up old caches here.
});

self.addEventListener('fetch', (event) => {
  // This simple fetch handler allows the app to be installable.
  // For a full offline experience, you would need to implement a caching strategy.
  event.respondWith(fetch(event.request));
});
