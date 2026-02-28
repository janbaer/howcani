// HowCanI service worker — dev placeholder (overwritten by build)
self.addEventListener('install', () => {});
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
