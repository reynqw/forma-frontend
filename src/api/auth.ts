import apiClient from './client'

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'BUYER' | 'AUTHOR' | 'ADMIN'
  status: string
  emailConfirmed: boolean
  avatarUrl?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
  message: string
}

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginData) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  confirmEmail: (token: string) =>
    apiClient.get(`/auth/confirm-email?token=${token}`),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  resendConfirmation: (email: string) =>
    apiClient.post('/auth/resend-confirmation', { email }),
}
