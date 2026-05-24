import apiClient from './client'

export interface CreateComplaintData {
  resourceId: number
  reason: string
  comment?: string
}

export const complaintsApi = {
  create: (data: CreateComplaintData) =>
    apiClient.post('/complaints', data),
}
