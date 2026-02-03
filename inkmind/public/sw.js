/* Minimal no-op service worker — satisfies PWA/browser requests for /sw.js to prevent 404 loop */
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
