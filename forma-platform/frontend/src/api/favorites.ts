import apiClient from './client'

export interface FavoriteResource {
  id: number
  name: string
  slug: string
  description: string
  price: number
  effectivePrice: number
  discount: number
  avgRating: number
  downloadCount: number
  viewCount: number
  status: string
  createdAt: string
  previewUrls: string[]
  author: { id: number; username: string; fullName: string }
  type: { id: number; name: string; slug: string }
  license: { id: number; name: string; type: string }
  font?: { style: string; family: string; format: string; fileUrl: string }
  tags: string[]
}

export interface FavoriteItem {
  id: number
  resource: FavoriteResource
  addedAt: string
}

export const favoritesApi = {
  getFavorites: (page = 0, size = 12) =>
    apiClient.get<{ content: FavoriteItem[]; totalElements: number; totalPages: number; number: number }>(
      '/favorites',
      { params: { page, size } }
    ),
  addFavorite: (resourceId: number) => apiClient.post(`/favorites/${resourceId}`),
  removeFavorite: (resourceId: number) => apiClient.delete(`/favorites/${resourceId}`),
  checkFavorite: (resourceId: number) => apiClient.get<{ isFavorite: boolean }>(`/favorites/${resourceId}/check`),
}
