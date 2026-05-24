import { create } from 'zustand'
import { notificationsApi } from '@/api/notifications'

interface NotificationState {
  unreadCount: number
  fetchUnreadCount: () => Promise<void>
  decrementUnread: () => void
  resetUnread: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount()
      set({ unreadCount: data.count })
    } catch {
      // ignore - user might not be logged in
    }
  },

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  resetUnread: () => set({ unreadCount: 0 }),
}))
