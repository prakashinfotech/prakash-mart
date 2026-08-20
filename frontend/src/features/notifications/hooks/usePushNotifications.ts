import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { pushApi } from '../api/pushApi'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i)
  return buffer.buffer
}

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Customer') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      try {
        console.log('[Push] Registering service worker...')
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        console.log('[Push] Service worker ready, scope:', reg.scope)

        // If already subscribed, sync endpoint with backend
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          console.log('[Push] Already subscribed, syncing with backend...')
          const json = existing.toJSON()
          await pushApi.subscribe({
            endpoint: existing.endpoint,
            p256dh: json.keys?.p256dh ?? '',
            auth: json.keys?.auth ?? '',
          })
          console.log('[Push] Subscription synced.')
          return
        }

        console.log('[Push] Requesting notification permission...')
        const permission = await Notification.requestPermission()
        console.log('[Push] Permission:', permission)
        if (permission !== 'granted') return

        console.log('[Push] Fetching VAPID public key...')
        const publicKey = await pushApi.getVapidKey()
        console.log('[Push] Got VAPID key, subscribing to push manager...')

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })

        console.log('[Push] Subscribed, sending to backend...')
        const json = subscription.toJSON()
        await pushApi.subscribe({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
        })
        console.log('[Push] Subscription saved to backend successfully.')
      } catch (err) {
        console.error('[Push] Subscription failed:', err)
      }
    }

    subscribe()
  }, [isAuthenticated, user?.role])
}
