import client from '@/shared/api/client'

export interface CategoryDto {
  id: string
  name: string
}

export const categoryApi = {
  getAll: async (): Promise<CategoryDto[]> => {
    const { data } = await client.get<CategoryDto[]>('/categories')
    return data
  },
}
