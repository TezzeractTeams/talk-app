// Custom service worker code for notification handling
// This will be merged with the Workbox service worker

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new message',
      icon: data.icon || '/chat.svg',
      badge: data.badge || '/chat.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'New Message', options)
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
