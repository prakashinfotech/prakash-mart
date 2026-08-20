export interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPercent: number | null
  category: string
  categoryId: string
  brandId: string
  brandName: string
  imageUrl: string
  imageUrls: string[]
  stock: number
  rating: number
  reviewCount: number
  sellerId: string
  sellerName: string
  warranty: string | null
  countryOfOrigin: string | null
  dispatchInfo: string | null
  shipsFrom: string | null
  offers: string[]
  minVariantPrice: number | null
  colorOptions: string[]
  slug: string
}

export interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'

export interface FilterState {
  category: string
  minPrice: number
  maxPrice: number
  minRating: number
  brands: string[]
  variantFilters: Record<string, string[]> // { "Size": ["M", "L"], "Color": ["Red"] }
}
