import apiClient from './client'

export interface CartItem {
  id: number
  resourceId: number
  resourceName: string
  resourceSlug: string
  resourcePrice: number
  previewUrl: string | null
  typeName: string | null
  authorName: string | null
  addedAt: string
}

export const cartApi = {
  getCart: () => apiClient.get<CartItem[]>('/cart'),
  getCount: () => apiClient.get<{ count: number }>('/cart/count'),
  addItem: (resourceId: number) => apiClient.post(`/cart/${resourceId}`),
  removeItem: (resourceId: number) => apiClient.delete(`/cart/${resourceId}`),
  clearCart: () => apiClient.delete('/cart'),
}
