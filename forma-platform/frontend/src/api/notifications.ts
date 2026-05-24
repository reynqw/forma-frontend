import apiClient from './client'

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export const notificationsApi = {
  getAll: (page = 0, size = 20) =>
    apiClient.get<{ content: Notification[]; totalElements: number; totalPages: number; number: number }>(
      '/notifications',
      { params: { page, size } }
    ),
  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
}
