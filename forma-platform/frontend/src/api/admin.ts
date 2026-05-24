import apiClient from './client'

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  emailConfirmed: boolean
  createdAt: string
}

export interface AdminResource {
  id: number
  name: string
  slug: string
  status: string
  author: { id: number; username: string }
  type: { name: string }
  createdAt: string
}

export interface AdminComplaint {
  id: number
  type: string
  description: string
  status: string
  createdAt: string
  reporter: { username: string }
  resource?: { id: number; name: string }
}

export interface AdminWithdrawal {
  id: number
  amount: number
  status: string
  requisites: string
  requestedAt: string
  author: { id: number; username: string }
}

export const adminApi = {
  getUsers: (page = 0, size = 20, search?: string) =>
    apiClient.get('/admin/users', { params: { page, size, search } }),

  updateUserStatus: (userId: number, status: string) =>
    apiClient.patch(`/admin/users/${userId}/status`, { status }),

  getPendingResources: (page = 0, size = 20) =>
    apiClient.get('/admin/resources/pending', { params: { page, size } }),

  moderateResource: (resourceId: number, decision: 'APPROVE' | 'REJECT', comment?: string) =>
    apiClient.post(`/admin/resources/${resourceId}/moderate`, { decision, comment }),

  getComplaints: (page = 0, size = 20) =>
    apiClient.get('/admin/complaints', { params: { page, size } }),

  resolveComplaint: (id: number, resolution: string) =>
    apiClient.patch(`/admin/complaints/${id}/resolve`, { resolution }),

  getPendingAuthors: (page = 0, size = 20) =>
    apiClient.get('/admin/authors/pending', { params: { page, size } }),

  verifyAuthor: (id: number, decision: 'APPROVE' | 'REJECT', comment?: string) =>
    apiClient.patch(`/admin/authors/${id}/verify`, { decision, comment }),

  getWithdrawals: (page = 0, size = 20) =>
    apiClient.get('/admin/withdrawals', { params: { page, size } }),

  processWithdrawal: (id: number, status: 'PROCESSED' | 'REJECTED', comment?: string) =>
    apiClient.patch(`/admin/withdrawals/${id}`, { status, comment }),

  deleteResource: (id: number) =>
    apiClient.delete(`/resources/${id}`),
}
