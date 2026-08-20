import client from '@/shared/api/client'
import type { OrderDto } from '@/features/order/api/orderApi'
import type { CategoryDto } from '@/features/category/api/categoryApi'

export interface AdminMonthlyRevenueDto {
  month: string
  revenue: number
  orders: number
}

export interface AdminCategoryRevenueDto {
  category: string
  revenue: number
}

export interface AdminStatsDto {
  totalOrders: number
  totalSellers: number
  totalProducts: number
  totalRevenue: number
  totalCustomers: number
  monthlyRevenue: AdminMonthlyRevenueDto[]
  topCategories: AdminCategoryRevenueDto[]
}

export interface SellerSummaryDto {
  id: string
  name: string
  email: string
  productCount: number
  joinedAt: string
  isActive: boolean
}

export interface CreateSellerPayload {
  name: string
  email: string
  password: string
}

export interface UserSummaryDto {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  joinedAt: string
}

export interface AdminProductDto {
  id: string
  name: string
  category: string
  brand: string
  price: number
  stock: number
  isActive: boolean
  sellerName: string
}

export const adminApi = {
  getAllOrders: async (): Promise<OrderDto[]> => {
    const { data } = await client.get<OrderDto[]>('/orders/all')
    return data
  },
  updateOrderStatus: async (orderId: string, status: string): Promise<OrderDto> => {
    const { data } = await client.patch<OrderDto>(`/orders/${orderId}/status`, JSON.stringify(status))
    return data
  },
  getStats: async (): Promise<AdminStatsDto> => {
    const { data } = await client.get<AdminStatsDto>('/admin/stats')
    return data
  },
  getSellers: async (): Promise<SellerSummaryDto[]> => {
    const { data } = await client.get<SellerSummaryDto[]>('/admin/sellers')
    return data
  },
  createSeller: async (payload: CreateSellerPayload): Promise<SellerSummaryDto> => {
    const { data } = await client.post<SellerSummaryDto>('/admin/sellers', payload)
    return data
  },
  toggleSeller: async (id: string): Promise<SellerSummaryDto> => {
    const { data } = await client.patch<SellerSummaryDto>(`/admin/sellers/${id}/toggle`)
    return data
  },
  getUsers: async (): Promise<UserSummaryDto[]> => {
    const { data } = await client.get<UserSummaryDto[]>('/admin/users')
    return data
  },
  toggleUser: async (id: string): Promise<UserSummaryDto> => {
    const { data } = await client.patch<UserSummaryDto>(`/admin/users/${id}/toggle`)
    return data
  },
  toggleProduct: async (id: string): Promise<AdminProductDto> => {
    const { data } = await client.patch<AdminProductDto>(`/admin/products/${id}/toggle`)
    return data
  },
  getCategories: async (): Promise<CategoryDto[]> => {
    const { data } = await client.get<CategoryDto[]>('/categories')
    return data
  },
  createCategory: async (name: string): Promise<CategoryDto> => {
    const { data } = await client.post<CategoryDto>('/categories', { name })
    return data
  },
  deleteCategory: async (id: string): Promise<void> => {
    await client.delete(`/categories/${id}`)
  },
}
