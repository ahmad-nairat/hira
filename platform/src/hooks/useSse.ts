import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { notificationsApi } from '../api/notifications.api'
import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'
import { describeNotification, notificationHref } from '../utils/notifications'
import type { ReadNotificationDTO } from '../types/api'

export function useSse(): void {
  const membership = useAuthStore((s) => s.membership)
  const accessToken = useAuthStore((s) => s.accessToken)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const markRead = useNotificationStore((s) => s.markRead)
  const navigate = useNavigate()

  useEffect(() => {
    if (!membership || !accessToken) return
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3010/api/v1'
    const url = `${base}/orgs/${membership.orgId}/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url, { withCredentials: true })
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as ReadNotificationDTO
        if (!payload?.id) return
        addNotification(payload)
        const href = notificationHref(payload)
        // Pop a live toast so the user notices in-flow events without
        // having to open the notification drawer. Dedup by id so a quick
        // reconnect doesn't fire twice for the same notification. If we
        // know where the notification points, give it a "View" action that
        // marks-as-read + navigates.
        toast(describeNotification(payload), {
          id: payload.id,
          action: href
            ? {
                label: 'View',
                onClick: () => {
                  markRead([payload.id])
                  notificationsApi.markRead(membership.orgId, payload.id).catch(() => { /* ignore */ })
                  navigate(href)
                },
              }
            : undefined,
        })
      } catch { /* ignore */ }
    }
    source.onerror = () => source.close()
    return () => source.close()
  }, [membership?.orgId, accessToken, addNotification, markRead, navigate])
}
