import client from '@/shared/api/client'

export interface AddressDto {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

export interface CreateAddressDto {
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  state: string
  postalCode: string
}

export const addressApi = {
  getAll: async (): Promise<AddressDto[]> => {
    const { data } = await client.get<AddressDto[]>('/addresses')
    return data
  },
  add: async (dto: CreateAddressDto): Promise<AddressDto> => {
    const { data } = await client.post<AddressDto>('/addresses', dto)
    return data
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/addresses/${id}`)
  },
  setDefault: async (id: string): Promise<void> => {
    await client.patch(`/addresses/${id}/default`)
  },
}
