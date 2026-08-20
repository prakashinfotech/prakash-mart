import client from '@/shared/api/client'
import type { User } from '@/features/auth/types/auth.types'

interface AuthResponse {
  userId: string
  name: string
  email: string
  role: string
  token: string
}

function toUser(r: AuthResponse): User {
  return { id: r.userId, name: r.name, email: r.email, role: r.role as User['role'] }
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await client.post<AuthResponse>('/auth/login', { email, password })
    return { user: toUser(data), token: data.token }
  },
  register: async (name: string, email: string, password: string, confirmPassword: string) => {
    const { data } = await client.post<AuthResponse>('/auth/register', { name, email, password, confirmPassword })
    return { user: toUser(data), token: data.token }
  },
  updateProfile: async (name: string) => {
    const { data } = await client.put<AuthResponse>('/auth/profile', { name })
    return { user: toUser(data), token: data.token }
  },
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await client.put('/auth/change-password', { currentPassword, newPassword, confirmPassword })
  },
  forgotPassword: async (email: string) => {
    await client.post('/auth/forgot-password', { email })
  },
  resetPassword: async (token: string, newPassword: string, confirmPassword: string) => {
    await client.post('/auth/reset-password', { token, newPassword, confirmPassword })
  },
}
