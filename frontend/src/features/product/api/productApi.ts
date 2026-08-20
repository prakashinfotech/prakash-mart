import client from '@/shared/api/client'
import type { Product } from '@/features/product/types/product.types'

export interface ProductFilter {
  category?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  size?: string
  color?: string
}

export interface VariantOptions {
  sizes: string[]
  colors: string[]
}

export interface Suggestion {
  term: string
  type: string
}

export const productApi = {
  getSuggestions: async (q: string): Promise<Suggestion[]> => {
    if (q.trim().length < 2) return []
    const { data } = await client.get<Suggestion[]>('/products/suggestions', { params: { q } })
    return data
  },
  getFiltered: async (filter?: ProductFilter): Promise<Product[]> => {
    const params: Record<string, string | number> = {}
    if (filter?.category) params.category = filter.category
    if (filter?.brandId) params.brandId = filter.brandId
    if (filter?.minPrice) params.minPrice = filter.minPrice
    if (filter?.maxPrice) params.maxPrice = filter.maxPrice
    if (filter?.minRating) params.minRating = filter.minRating
    if (filter?.size) params.size = filter.size
    if (filter?.color) params.color = filter.color
    const { data } = await client.get<Product[]>('/products', { params })
    return data
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await client.get<Product>(`/products/${id}`)
    return data
  },
  getBySlug: async (slug: string): Promise<Product> => {
    const { data } = await client.get<Product>(`/products/${slug}`)
    return data
  },
  getVariantOptions: async (): Promise<VariantOptions> => {
    const { data } = await client.get<VariantOptions>('/products/variant-options')
    return data
  },
}
