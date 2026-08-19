import client from '@/shared/api/client'

export interface MonthlyRevenueDto {
  month: string
  revenue: number
}

export interface TopProductDto {
  productName: string
  unitsSold: number
  revenue: number
}

export interface SellerAnalyticsDto {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
  monthlyRevenue: MonthlyRevenueDto[]
  topProducts: TopProductDto[]
}

export const sellerAnalyticsApi = {
  get: async (): Promise<SellerAnalyticsDto> => {
    const { data } = await client.get<SellerAnalyticsDto>('/seller/analytics')
    return data
  },
}
