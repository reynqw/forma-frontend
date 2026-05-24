import { create } from 'zustand'
import apiClient from '@/api/client'

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

interface CartState {
  items: CartItem[]
  count: number
  loading: boolean
  fetchCart: () => Promise<void>
  addItem: (resourceId: number) => Promise<void>
  removeItem: (resourceId: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  count: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true })
    try {
      const { data } = await apiClient.get<CartItem[]>('/cart')
      set({ items: data, count: data.length, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addItem: async (resourceId) => {
    await apiClient.post(`/cart/${resourceId}`)
    await get().fetchCart()
  },

  removeItem: async (resourceId) => {
    await apiClient.delete(`/cart/${resourceId}`)
    set((state) => ({
      items: state.items.filter((i) => i.resourceId !== resourceId),
      count: state.count - 1,
    }))
  },

  clearCart: async () => {
    await apiClient.delete('/cart')
    set({ items: [], count: 0 })
  },
}))
