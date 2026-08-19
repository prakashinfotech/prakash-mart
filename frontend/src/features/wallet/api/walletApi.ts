import client from '@/shared/api/client'

export interface WalletTransactionDto {
  id: string
  amount: number
  type: 'Credit' | 'Debit'
  description: string
  orderId: string | null
  createdAt: string
}

export interface WalletDto {
  id: string
  balance: number
  transactions: WalletTransactionDto[]
}

export const walletApi = {
  get: async (): Promise<WalletDto> => {
    const { data } = await client.get<WalletDto>('/wallet')
    return data
  },
  getBalance: async (): Promise<number> => {
    const { data } = await client.get<{ balance: number }>('/wallet/balance')
    return data.balance
  },
}
