// Atlas PWA Custom Service Worker Extensions
// Handles notification interactions, background actions, and deep-linking

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Target URL from notification data, default to timeline or home
  const targetUrl = event.notification.data?.url || '/timeline';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Check if an Atlas window/tab is already open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          // Focus existing window
          client.focus();
          // Navigate to target URL if different
          if ('navigate' in client && !client.url.includes(targetUrl)) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // 2. If no window is currently open, open a new window to the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Optional telemetry or cleanup on user notification dismissal
  console.log('[Atlas SW] Notification dismissed by user:', event.notification.tag);
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Atlas Medical Study OS';
    const options = {
      body: payload.body || 'You have scheduled spaced repetition revisions due today.',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: payload.tag || 'atlas-push-notification',
      data: payload.data || { url: '/timeline' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('[Atlas SW] Push event payload parsing failed:', err);
  }
});
