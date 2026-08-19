import client from '@/shared/api/client'

export interface RazorpayOrderResponse {
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export const paymentApi = {
  createRazorpayOrder: async (amount: number): Promise<RazorpayOrderResponse> => {
    const { data } = await client.post<RazorpayOrderResponse>('/payments/create-order', { amount })
    return data
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<void> => {
    await client.post('/payments/verify', payload)
  },
}
