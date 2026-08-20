import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/features/product/types/product.types'

export interface CartItem {
  product: Product
  quantity: number
  variantId?: string
  variantLabel?: string
  unitPrice: number
}

function itemKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId
}

interface CartState {
  items: CartItem[]
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (product: Product, variantId?: string, variantLabel?: string, priceOverride?: number, qty?: number) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      addItem: (product, variantId, variantLabel, priceOverride, qty = 1) => {
        const items = get().items
        const key = itemKey(product.id, variantId)
        const existing = items.find((i) => itemKey(i.product.id, i.variantId) === key)
        if (existing) {
          set({ items: items.map((i) => itemKey(i.product.id, i.variantId) === key ? { ...i, quantity: i.quantity + qty } : i) })
        } else {
          set({ items: [...items, { product, quantity: qty, variantId, variantLabel, unitPrice: priceOverride ?? product.price }] })
        }
      },
      removeItem: (productId, variantId) => {
        const key = itemKey(productId, variantId)
        set({ items: get().items.filter((i) => itemKey(i.product.id, i.variantId) !== key) })
      },
      updateQuantity: (productId, quantity, variantId) => {
        const key = itemKey(productId, variantId)
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => itemKey(i.product.id, i.variantId) !== key) })
        } else {
          set({ items: get().items.map((i) => itemKey(i.product.id, i.variantId) === key ? { ...i, quantity } : i) })
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage', partialize: (state) => ({ items: state.items }) }
  )
)
