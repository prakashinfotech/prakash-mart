import client from '@/shared/api/client'

interface SubscribePayload {
  endpoint: string
  p256dh: string
  auth: string
}

export const pushApi = {
  getVapidKey: async (): Promise<string> => {
    const { data } = await client.get<{ key: string }>('/push/vapid-public-key')
    return data.key
  },

  subscribe: async (payload: SubscribePayload): Promise<void> => {
    await client.post('/push/subscribe', payload)
  },

  unsubscribe: async (endpoint: string): Promise<void> => {
    await client.delete('/push/unsubscribe', { data: { endpoint } })
  },
}
