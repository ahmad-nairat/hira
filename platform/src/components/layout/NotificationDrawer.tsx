import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { X, Bell, BadgeCheck, Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import { notificationsApi } from '../../api/notifications.api'
import { useOrgId } from '../../hooks/useOrg'
import { useNotificationStore } from '../../stores/notification.store'
import Button from '../ui/Button'
import { formatDateTime } from '../../utils/format'
import type { ReadNotificationDTO } from '../../types/api'

const ICONS: Record<string, typeof Bell> = {
  assignment: Bell,
  hm_approval: BadgeCheck,
  new_feedback: ThumbsUp,
  offer_accepted: Send,
  offer_declined: ThumbsDown,
}

function describe(n: ReadNotificationDTO): string {
  switch (n.type) {
    case 'assignment': return 'You were assigned to an interview.'
    case 'hm_approval': return 'A candidate was approved by the hiring manager.'
    case 'new_feedback': return 'New interview feedback was submitted.'
    case 'offer_accepted': return 'A candidate accepted their offer.'
    case 'offer_declined': return 'A candidate declined their offer.'
    default: return 'New notification.'
  }
}

interface Props { open: boolean; onClose: () => void }

export default function NotificationDrawer({ open, onClose }: Props) {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const { notifications, unreadCount, setAll, markRead } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', orgId],
    queryFn: () => notificationsApi.list(orgId, { page: 1, limit: 30 }),
    enabled: open,
  })

  useEffect(() => {
    if (data) setAll(data.data, data.meta.unreadCount ?? 0)
  }, [data, setAll])

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(orgId),
    onSuccess: () => {
      markRead(notifications.map((n) => n.id))
      qc.invalidateQueries({ queryKey: ['notifications', orgId] })
    },
  })

  return (
    <>
      <div className={clsx('drawer-overlay', open && 'open')} onClick={onClose} />
      <aside className={clsx('drawer', open && 'open')} aria-hidden={!open}>
        <div className="flex items-center justify-between px-[18px] py-4 border-b border-border-soft">
          <div>
            <div className="text-[15px] font-semibold">Notifications</div>
            <div className="text-ink-3 text-xs mt-0.5">{unreadCount} unread</div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <Button size="sm" onClick={() => markAll.mutate()}>Mark all read</Button>}
            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-ink-3 text-sm">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center text-ink-3 text-sm">No notifications yet.</div>
          ) : (
            notifications.map((n) => {
              const Ico = ICONS[n.type] ?? Bell
              return (
                <div
                  key={n.id}
                  className={clsx(
                    'flex gap-3 px-[18px] py-3.5 border-b border-border-soft relative',
                    !n.isRead && 'bg-primary/[0.04]',
                  )}
                >
                  {!n.isRead && <span className="absolute left-2 top-[22px] w-1.5 h-1.5 rounded-full bg-primary" />}
                  <div className="icon-tile mt-0.5" style={{ width: 32, height: 32 }}>
                    <Ico size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] leading-snug text-ink">{describe(n)}</div>
                    <div className="text-ink-4 text-xs mt-1">{formatDateTime(n.createdAt)}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
