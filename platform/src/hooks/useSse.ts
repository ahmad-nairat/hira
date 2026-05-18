import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'
import type { ReadNotificationDTO } from '../types/api'

export function useSse(): void {
  const membership = useAuthStore((s) => s.membership)
  const accessToken = useAuthStore((s) => s.accessToken)
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!membership || !accessToken) return
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3010/api/v1'
    const url = `${base}/orgs/${membership.orgId}/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url, { withCredentials: true })
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as ReadNotificationDTO
        if (payload?.id) addNotification(payload)
      } catch { /* ignore */ }
    }
    source.onerror = () => source.close()
    return () => source.close()
  }, [membership?.orgId, accessToken, addNotification])
}
