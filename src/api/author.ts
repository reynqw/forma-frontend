import apiClient from './client'
import type { Resource } from './resources'

export interface AuthorProfile {
  id: number
  username: string
  displayName: string
  bio?: string
  website?: string
  avatarUrl?: string
  resourceCount: number
  totalDownloads: number
  avgRating: number
  verificationStatus: string
}

export interface AuthorStats {
  totalSales: number
  totalRevenue: number
  authorRevenue: number
  platformRevenue: number
  totalDownloads: number
  avgRating: number
  resourceCount: number
  pendingBalance: number
  availableBalance: number
}

export interface WithdrawalRequest {
  amount: number
  requisites: string
}

export interface BecomeAuthorData {
  username: string
  biography?: string
  portfolio?: string
}

export interface AuthorApplicationStatus {
  hasApplication: boolean
  username?: string
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  createdAt?: string
}

export const authorApi = {
  applyBecomeAuthor: (data: BecomeAuthorData) =>
    apiClient.post('/authors/apply', data),

  getApplicationStatus: () =>
    apiClient.get<AuthorApplicationStatus>('/authors/apply/status'),

  getPublicProfile: (username: string) =>
    apiClient.get<AuthorProfile>(`/authors/${username}`),

  getPublicResources: (username: string, page = 0, size = 12) =>
    apiClient.get<{ content: Resource[]; totalElements: number; totalPages: number; number: number }>(
      `/authors/${username}/resources`,
      { params: { page, size } }
    ),

  getMyStats: () => apiClient.get<AuthorStats>('/author/stats'),

  getMyResources: (page = 0, size = 12) =>
    apiClient.get<{ content: Resource[]; totalElements: number; totalPages: number; number: number }>(
      '/author/resources',
      { params: { page, size } }
    ),

  requestWithdrawal: (data: WithdrawalRequest) =>
    apiClient.post('/author/withdrawals', data),

  getWithdrawals: (page = 0, size = 10) =>
    apiClient.get('/author/withdrawals', { params: { page, size } }),
}
