import client from '@/shared/api/client'

export interface CartItemDto {
  id: string
  productId: string
  productName: string
  productImageUrl: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface CartDto {
  cartId: string
  items: CartItemDto[]
  total: number
}

export const cartApi = {
  get: async (): Promise<CartDto> => {
    const { data } = await client.get<CartDto>('/cart')
    return data
  },
  addItem: async (productId: string, quantity: number): Promise<CartDto> => {
    const { data } = await client.post<CartDto>('/cart/items', { productId, quantity })
    return data
  },
  updateItem: async (itemId: string, quantity: number): Promise<CartDto> => {
    const { data } = await client.put<CartDto>(`/cart/items/${itemId}`, quantity)
    return data
  },
  removeItem: async (itemId: string): Promise<CartDto> => {
    const { data } = await client.delete<CartDto>(`/cart/items/${itemId}`)
    return data
  },
  clear: async (): Promise<void> => {
    await client.delete('/cart')
  },
}
