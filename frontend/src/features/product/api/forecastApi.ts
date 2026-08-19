import client from '@/shared/api/client'

export interface VariantForecastDto {
  variantId: string
  productId: string
  productName: string
  variantLabel: string
  sku: string
  availableStock: number
  reservedQuantity: number
  velocity7d: number
  velocity30d: number
  daysRemaining: number   // -1 = no sales (infinite); 0 = out of stock
  status: 'OutOfStock' | 'Critical' | 'Low' | 'Healthy' | 'NoSales'
}

export interface ForecastSummaryDto {
  totalVariants: number
  outOfStockCount: number
  criticalCount: number
  lowCount: number
  healthyCount: number
  noSalesCount: number
  items: VariantForecastDto[]
}

export const forecastApi = {
  getSeller: async (): Promise<ForecastSummaryDto> => {
    const { data } = await client.get<ForecastSummaryDto>('/inventory/forecast')
    return data
  },
  getAdmin: async (): Promise<ForecastSummaryDto> => {
    const { data } = await client.get<ForecastSummaryDto>('/inventory/forecast/admin')
    return data
  },
}
