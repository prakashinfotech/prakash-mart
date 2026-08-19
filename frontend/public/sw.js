self.addEventListener('push', event => {
  console.log('[SW] Push event received', event.data?.text())
  const data = event.data?.json() ?? { title: 'PrakashMart', body: 'You have an update.' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: { url: data.url ?? '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const targetUrl = event.notification.data?.url ?? '/'
      for (const client of windowClients) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(targetUrl)
    })
  )
})
