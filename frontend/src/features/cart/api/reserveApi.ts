import client from '@/shared/api/client'

export interface ReserveCartItem {
  variantId: string
  quantity: number
}

export interface ReservedItemSummary {
  variantId: string
  variantLabel: string
  sku: string
  quantity: number
}

export interface CartReservationStatus {
  isActive: boolean
  expiresAt: string | null
  secondsRemaining: number
  items: ReservedItemSummary[]
}

export const reserveApi = {
  reserve: async (items: ReserveCartItem[]): Promise<CartReservationStatus> => {
    const { data } = await client.post<CartReservationStatus>('/cart/reserve', { items })
    return data
  },
  release: async (): Promise<void> => {
    await client.delete('/cart/reserve')
  },
  status: async (): Promise<CartReservationStatus> => {
    const { data } = await client.get<CartReservationStatus>('/cart/reserve/status')
    return data
  },
}
