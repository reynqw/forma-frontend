import apiClient from './client'

export interface Order {
  id: number
  status: string
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  price: number
  resource: {
    id: number
    name: string
    slug: string
    previewUrls: string[]
    author: { username: string }
    type: { name: string }
  }
  licenseKey?: string
}

export interface PaymentUrlResponse {
  paymentUrl: string
}

export const ordersApi = {
  createFromCart: () => apiClient.post<Order>('/orders'),
  getMyOrders: (page = 0, size = 10) =>
    apiClient.get<{ content: Order[]; totalElements: number; totalPages: number; number: number }>('/orders', {
      params: { page, size },
    }),
  getById: (id: number) => apiClient.get<Order>(`/orders/${id}`),
  getPaymentUrl: (orderId: number) => apiClient.post<PaymentUrlResponse>(`/orders/${orderId}/pay`),
  demoPay: (orderId: number) => apiClient.post<Order>(`/orders/${orderId}/demo-pay`),
  cancel: (orderId: number) => apiClient.post(`/orders/${orderId}/cancel`),
}
