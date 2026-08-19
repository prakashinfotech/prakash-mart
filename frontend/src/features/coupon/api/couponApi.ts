import client from '@/shared/api/client'

export interface CouponDto {
  id: string
  code: string
  discountPercent: number
  maxUses: number
  usedCount: number
  expiresAt: string
  isActive: boolean
}

export interface CouponValidateDto {
  code: string
  discountPercent: number
  discountAmount: number
  finalAmount: number
}

export interface CreateCouponDto {
  code: string
  discountPercent: number
  maxUses: number
  expiresAt: string
}

export const couponApi = {
  validate: async (code: string, cartTotal: number): Promise<CouponValidateDto> => {
    const { data } = await client.get<CouponValidateDto>('/coupons/validate', { params: { code, cartTotal } })
    return data
  },
  getAll: async (): Promise<CouponDto[]> => {
    const { data } = await client.get<CouponDto[]>('/coupons')
    return data
  },
  create: async (dto: CreateCouponDto): Promise<CouponDto> => {
    const { data } = await client.post<CouponDto>('/coupons', dto)
    return data
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/coupons/${id}`)
  },
}
