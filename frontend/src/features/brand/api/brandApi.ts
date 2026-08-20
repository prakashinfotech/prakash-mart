import client from '@/shared/api/client'

export interface BrandDto {
  id: string
  name: string
  description?: string | null
  categoryId?: string | null
  categoryName?: string | null
}

export const brandApi = {
  getAll: async (): Promise<BrandDto[]> => {
    const { data } = await client.get<BrandDto[]>('/brands')
    return data
  },
  getByCategory: async (categoryId: string): Promise<BrandDto[]> => {
    const { data } = await client.get<BrandDto[]>('/brands', { params: { categoryId } })
    return data
  },
}
