import apiClient from './client'

export interface Review {
  id: number
  rating: number
  comment: string
  createdAt: string
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateReviewData {
  resourceId: number
  rating: number
  comment: string
}

export const reviewsApi = {
  getByResource: (resourceId: number, page = 0, size = 10) =>
    apiClient.get<{ content: Review[]; totalElements: number; totalPages: number; number: number }>(
      `/reviews/resource/${resourceId}`,
      { params: { page, size } }
    ),
  create: (data: CreateReviewData) => apiClient.post<Review>('/reviews', data),
  delete: (id: number) => apiClient.delete(`/reviews/${id}`),
}
