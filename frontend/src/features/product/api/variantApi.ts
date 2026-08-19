import client from '@/shared/api/client'

export interface ProductVariantDto {
  id: string
  productId: string
  sku: string
  barcode: string | null
  attributes: Record<string, string>
  stock: number
  reservedQuantity: number
  availableStock: number
  priceOverride: number | null
  isActive: boolean
  label: string
}

export interface CreateVariantDto {
  attributes: Record<string, string>
  stock: number
  priceOverride: number | null
  sku?: string
  barcode?: string
}

export interface UpdateVariantDto {
  attributes: Record<string, string>
  stock: number
  priceOverride: number | null
  barcode?: string
}

export interface CategoryVariantTypeDto {
  variantTypeId: string
  name: string
  displayType: 'select' | 'text' | 'color'
  suggestedOptions: string[]
  displayOrder: number
  isRequired: boolean
}

export interface VariantTypeDto {
  id: string
  name: string
  displayType: 'select' | 'text' | 'color'
  suggestedOptions: string[]
  isActive: boolean
  categoryIds: string[]
}

export interface CreateVariantTypeDto {
  name: string
  displayType: 'select' | 'text' | 'color'
  suggestedOptions: string[]
  categoryIds: string[]
}

export interface UpdateVariantTypeDto extends CreateVariantTypeDto {}

export const variantApi = {
  getByProduct: async (productId: string): Promise<ProductVariantDto[]> => {
    const { data } = await client.get<ProductVariantDto[]>(`/products/${productId}/variants`)
    return data
  },
  create: async (productId: string, dto: CreateVariantDto): Promise<ProductVariantDto> => {
    const { data } = await client.post<ProductVariantDto>(`/products/${productId}/variants`, dto)
    return data
  },
  update: async (productId: string, variantId: string, dto: UpdateVariantDto): Promise<ProductVariantDto> => {
    const { data } = await client.put<ProductVariantDto>(`/products/${productId}/variants/${variantId}`, dto)
    return data
  },
  toggle: async (productId: string, variantId: string): Promise<void> => {
    await client.patch(`/products/${productId}/variants/${variantId}/toggle`)
  },
  delete: async (productId: string, variantId: string): Promise<void> => {
    await client.delete(`/products/${productId}/variants/${variantId}`)
  },
}

export interface InventoryTransactionDto {
  id: string
  productVariantId: string
  productName: string
  variantLabel: string
  sku: string
  changeType: string
  quantityBefore: number
  quantityAfter: number
  quantityChanged: number
  reason: string
  referenceId: string | null
  createdBy: string | null
  createdAt: string
}

export const inventoryApi = {
  getSellerHistory: async (): Promise<InventoryTransactionDto[]> => {
    const { data } = await client.get<InventoryTransactionDto[]>('/inventory/seller/history')
    return data
  },
  // Accepts UUID or SKU (e.g. "VAR-1D62B35D")
  lookup: async (q: string): Promise<{ variantId: string; history: InventoryTransactionDto[] }> => {
    const { data } = await client.get<{ variantId: string; history: InventoryTransactionDto[] }>(`/inventory/lookup?q=${encodeURIComponent(q)}`)
    return data
  },
  getVariantHistory: async (variantId: string): Promise<InventoryTransactionDto[]> => {
    const { data } = await client.get<InventoryTransactionDto[]>(`/inventory/variants/${variantId}/history`)
    return data
  },
  adminAdjust: async (variantId: string, newStock: number, reason: string): Promise<void> => {
    await client.post(`/inventory/variants/${variantId}/adjust`, { newStock, reason })
  },
}

export const variantTypeApi = {
  getByCategory: async (categoryId: string): Promise<CategoryVariantTypeDto[]> => {
    const { data } = await client.get<CategoryVariantTypeDto[]>(`/variant-types/by-category/${categoryId}`)
    return data
  },
  getAll: async (): Promise<VariantTypeDto[]> => {
    const { data } = await client.get<VariantTypeDto[]>('/variant-types')
    return data
  },
  getById: async (id: string): Promise<VariantTypeDto> => {
    const { data } = await client.get<VariantTypeDto>(`/variant-types/${id}`)
    return data
  },
  create: async (dto: CreateVariantTypeDto): Promise<VariantTypeDto> => {
    const { data } = await client.post<VariantTypeDto>('/variant-types', dto)
    return data
  },
  update: async (id: string, dto: UpdateVariantTypeDto): Promise<VariantTypeDto> => {
    const { data } = await client.put<VariantTypeDto>(`/variant-types/${id}`, dto)
    return data
  },
  toggle: async (id: string): Promise<void> => {
    await client.patch(`/variant-types/${id}/toggle`)
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/variant-types/${id}`)
  },
}
