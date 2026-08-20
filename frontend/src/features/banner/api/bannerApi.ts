import client from '@/shared/api/client'

export interface BannerDto {
  id: string
  title: string
  subtitle: string
  badge: string
  ctaText: string
  ctaCategory: string
  gradient: string
  emoji: string
  sortOrder: number
  isActive: boolean
}

export interface CreateBannerDto {
  title: string
  subtitle: string
  badge: string
  ctaText: string
  ctaCategory: string
  gradient: string
  emoji: string
  sortOrder: number
}

export interface UpdateBannerDto extends CreateBannerDto {}

export const bannerApi = {
  getActive: async (): Promise<BannerDto[]> => {
    const { data } = await client.get<BannerDto[]>('/banners')
    return data
  },
  getAll: async (): Promise<BannerDto[]> => {
    const { data } = await client.get<BannerDto[]>('/banners/all')
    return data
  },
  create: async (dto: CreateBannerDto): Promise<BannerDto> => {
    const { data } = await client.post<BannerDto>('/banners', dto)
    return data
  },
  update: async (id: string, dto: UpdateBannerDto): Promise<BannerDto> => {
    const { data } = await client.put<BannerDto>(`/banners/${id}`, dto)
    return data
  },
  toggle: async (id: string): Promise<void> => {
    await client.patch(`/banners/${id}/toggle`)
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/banners/${id}`)
  },
}
