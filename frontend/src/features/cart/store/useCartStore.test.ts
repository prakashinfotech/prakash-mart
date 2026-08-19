import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './useCartStore'
import type { Product } from '@/features/product/types/product.types'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Test Product',
  description: 'A product',
  price: 1000,
  discountPercent: null,
  category: 'Electronics',
  categoryId: 'cat-1',
  brandId: 'brand-1',
  brandName: 'BrandX',
  imageUrl: 'img.jpg',
  imageUrls: [],
  stock: 10,
  rating: 4.5,
  reviewCount: 20,
  sellerId: 'seller-1',
  sellerName: 'Seller One',
  warranty: null,
  countryOfOrigin: null,
  dispatchInfo: null,
  shipsFrom: null,
  offers: [],
  minVariantPrice: null,
  colorOptions: [],
  slug: 'test-product',
  ...overrides,
})

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('useCartStore', () => {
  it('adds a new item to the cart', () => {
    const product = makeProduct()
    useCartStore.getState().addItem(product)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('prod-1')
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when same product is added again', () => {
    const product = makeProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().addItem(product)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('treats same product with different variants as separate items', () => {
    const product = makeProduct()
    useCartStore.getState().addItem(product, 'variant-1', 'M / Red')
    useCartStore.getState().addItem(product, 'variant-2', 'L / Blue')
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('removes an item by productId', () => {
    const product = makeProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().removeItem('prod-1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates the correct total', () => {
    const p1 = makeProduct({ id: 'p1', price: 500 })
    const p2 = makeProduct({ id: 'p2', price: 200 })
    useCartStore.getState().addItem(p1)
    useCartStore.getState().addItem(p1) // qty 2 → 1000
    useCartStore.getState().addItem(p2)  // qty 1 → 200
    expect(useCartStore.getState().getTotal()).toBe(1200)
  })

  it('uses priceOverride when provided', () => {
    const product = makeProduct({ price: 1000 })
    useCartStore.getState().addItem(product, undefined, undefined, 750)
    expect(useCartStore.getState().items[0].unitPrice).toBe(750)
    expect(useCartStore.getState().getTotal()).toBe(750)
  })

  it('clears all items', () => {
    const p1 = makeProduct({ id: 'p1' })
    const p2 = makeProduct({ id: 'p2' })
    useCartStore.getState().addItem(p1)
    useCartStore.getState().addItem(p2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updateQuantity removes item when quantity is 0 or less', () => {
    const product = makeProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().updateQuantity('prod-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('getItemCount sums quantities across all items', () => {
    const p1 = makeProduct({ id: 'p1' })
    const p2 = makeProduct({ id: 'p2' })
    useCartStore.getState().addItem(p1)
    useCartStore.getState().addItem(p1)
    useCartStore.getState().addItem(p2)
    expect(useCartStore.getState().getItemCount()).toBe(3)
  })
})
