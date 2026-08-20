import client from '@/shared/api/client'
import type { Product } from '@/features/product/types/product.types'

export interface CreateProductPayload {
  name: string
  description: string
  price: number
  discountPercent: number | null
  categoryId: string
  brandId: string
  imageUrl: string
  stock: number
  imageUrls?: string[]
  warranty?: string | null
  countryOfOrigin?: string | null
  dispatchInfo?: string | null
  shipsFrom?: string | null
  offers?: string[]
}

export interface SellerOrderItemDto {
  productId: string
  productName: string
  variantLabel?: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface SellerOrderDto {
  orderId: string
  status: string
  orderDate: string
  customerName: string
  items: SellerOrderItemDto[]
  sellerRevenue: number
}

export interface SellerReturnDto {
  id: string
  orderId: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedAt: string
}

export const sellerApi = {
  getMyProducts: async (): Promise<Product[]> => {
    const { data } = await client.get<Product[]>('/products')
    return data
  },
  create: async (payload: CreateProductPayload): Promise<Product> => {
    const { data } = await client.post<Product>('/products', payload)
    return data
  },
  update: async (id: string, payload: CreateProductPayload): Promise<Product> => {
    const { data } = await client.put<Product>(`/products/${id}`, payload)
    return data
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/products/${id}`)
  },
  getSellerOrders: async (): Promise<SellerOrderDto[]> => {
    const { data } = await client.get<SellerOrderDto[]>('/seller/orders')
    return data
  },
  getReturns: async (): Promise<SellerReturnDto[]> => {
    const { data } = await client.get<SellerReturnDto[]>('/seller/returns')
    return data
  },
  processReturn: async (returnId: string, approve: boolean): Promise<SellerReturnDto> => {
    const { data } = await client.patch<SellerReturnDto>(`/seller/returns/${returnId}`, { approve })
    return data
  },
}
