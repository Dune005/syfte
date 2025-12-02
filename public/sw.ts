// Custom Service Worker for Push Notifications
/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Take control immediately
self.skipWaiting();
clientsClaim();

// Push notification event listener
self.addEventListener('push', (event: PushEvent) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.warn('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, data: notificationData } = data;

    const options: any = {
      body,
      icon: icon || '/android-chrome-192x192.png',
      badge: badge || '/android-chrome-192x192.png',
      data: notificationData || {},
      tag: notificationData?.type || 'default',
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Öffnen'
        },
        {
          action: 'close',
          title: 'Schließen'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Syfte', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click event listener
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Push subscription change event
self.addEventListener('pushsubscriptionchange', (event: any) => {
  console.log('Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This will be replaced by the actual VAPID public key
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ) as any
    }).then((subscription) => {
      console.log('Resubscribed to push notifications');
      // Send new subscription to backend
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });
    })
  );
});

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
