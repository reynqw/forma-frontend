import apiClient from './client'

export interface Resource {
  id: number
  name: string
  slug: string
  description: string
  price: number
  effectivePrice?: number
  discount?: number
  avgRating: number
  downloadCount: number
  viewCount: number
  status: string
  createdAt: string
  previewUrls?: string[]
  /** @deprecated use previewUrls */
  previewUrl?: string
  author: { id: number; username: string; fullName: string }
  type: { id: number; name: string; slug: string }
  license: { id: number; name: string; type: string }
  font?: { style: string; family: string; format: string; fileUrl: string }
  tags: string[]
}

export interface ResourceFilter {
  typeId?: number
  minPrice?: number
  maxPrice?: number
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export const resourcesApi = {
  getCatalog: (filters: ResourceFilter = {}) =>
    apiClient.get<PageResponse<Resource>>('/resources', { params: filters }),

  search: (q: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Resource>>('/resources/search', { params: { q, page, size } }),

  getById: (id: number) =>
    apiClient.get<Resource>(`/resources/${id}`),

  getBySlug: (slug: string) =>
    apiClient.get<Resource>(`/resources/slug/${slug}`),

  create: (data: FormData) =>
    apiClient.post<Resource>('/resources', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getForEdit: (id: number) =>
    apiClient.get<Resource>(`/resources/${id}/edit`),

  update: (id: number, data: FormData) =>
    apiClient.put<Resource>(`/resources/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) =>
    apiClient.delete(`/resources/${id}`),
}
