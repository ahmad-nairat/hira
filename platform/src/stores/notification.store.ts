import { create } from 'zustand'
import type { ReadNotificationDTO } from '../types/api'

interface State {
  notifications: ReadNotificationDTO[]
  unreadCount: number
  addNotification: (n: ReadNotificationDTO) => void
  markRead: (ids: string[]) => void
  setAll: (items: ReadNotificationDTO[], unread: number) => void
}

export const useNotificationStore = create<State>()((set) => ({
  notifications: [], unreadCount: 0,
  addNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications].slice(0, 200), unreadCount: s.unreadCount + (n.isRead ? 0 : 1) })),
  markRead: (ids) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - ids.length),
    })),
  setAll: (notifications, unreadCount) => set({ notifications, unreadCount }),
}))
