import client from '@/shared/api/client'

export interface CreateOrderPayload {
  shippingAddress: string
  city: string
  state: string
  postalCode: string
  paymentMethod: string
  items: { productId: string; quantity: number; variantId?: string }[]
  couponCode?: string
  walletAmount?: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
}

export interface OrderItemDto {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  variantLabel?: string
}

export interface OrderDto {
  id: string
  status: string
  shippingAddress: string
  city: string
  state: string
  postalCode: string
  paymentMethod: string
  totalAmount: number
  items: OrderItemDto[]
  createdAt: string
  couponCode?: string
  discountAmount?: number
  walletAmountUsed?: number
}

export const orderApi = {
  create: async (payload: CreateOrderPayload): Promise<OrderDto> => {
    const { data } = await client.post<OrderDto>('/orders', payload)
    return data
  },
  getMyOrders: async (): Promise<OrderDto[]> => {
    const { data } = await client.get<OrderDto[]>('/orders')
    return data
  },
  getById: async (id: string): Promise<OrderDto> => {
    const { data } = await client.get<OrderDto>(`/orders/${id}`)
    return data
  },
  cancelOrder: async (id: string): Promise<OrderDto> => {
    const { data } = await client.post<OrderDto>(`/orders/${id}/cancel`)
    return data
  },
  downloadInvoice: async (id: string): Promise<void> => {
    const response = await client.get(`/orders/${id}/invoice`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${id.slice(0, 8).toUpperCase()}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  },
  requestReturn: async (id: string, reason: string): Promise<OrderReturnDto> => {
    const { data } = await client.post<OrderReturnDto>(`/orders/${id}/return`, { reason })
    return data
  },
  getReturn: async (id: string): Promise<OrderReturnDto | null> => {
    const { data } = await client.get<OrderReturnDto | null>(`/orders/${id}/return`)
    return data
  },
}

export interface OrderReturnDto {
  id: string
  orderId: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedAt: string
}
