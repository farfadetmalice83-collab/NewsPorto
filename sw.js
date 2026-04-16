// sw.js — Service Worker pour les notifications push
// À placer à la racine du site (même niveau qu'index.html)

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title   = data.title || 'NewsPorto';
  const options = {
    body:    data.body  || '',
    icon:    data.icon  || '/Logo.png',
    badge:   data.badge || '/favicon.ico',
    data:    { url: data.url || 'https://newsporto.fr' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Lire →' },
      { action: 'close', title: 'Fermer' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || 'https://newsporto.fr';
  event.waitUntil(clients.openWindow(url));
});
