import client from '@/shared/api/client'

export interface ReviewDto {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface CanReviewDto {
  canReview: boolean
  reason: string
}

export const reviewApi = {
  getByProduct: async (productId: string): Promise<ReviewDto[]> => {
    const { data } = await client.get<ReviewDto[]>(`/reviews/product/${productId}`)
    return data
  },
  canReview: async (productId: string): Promise<CanReviewDto> => {
    const { data } = await client.get<CanReviewDto>(`/reviews/${productId}/can-review`)
    return data
  },
  create: async (productId: string, rating: number, comment: string): Promise<ReviewDto> => {
    const { data } = await client.post<ReviewDto>('/reviews', { productId, rating, comment })
    return data
  },
  delete: async (reviewId: string): Promise<void> => {
    await client.delete(`/reviews/${reviewId}`)
  },
}
