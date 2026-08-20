import { create } from 'zustand'
import { walletApi } from '@/features/wallet/api/walletApi'

interface WalletStore {
  balance: number
  loaded: boolean
  fetchBalance: () => Promise<void>
  setBalance: (balance: number) => void
  reset: () => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  loaded: false,
  fetchBalance: async () => {
    try {
      const balance = await walletApi.getBalance()
      set({ balance, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  setBalance: (balance) => set({ balance }),
  reset: () => set({ balance: 0, loaded: false }),
}))
