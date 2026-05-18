import { z } from 'zod'
import { Notification, NotificationType } from '../entities/notification.entity'

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional(),
})

export type NotificationQueryDTO = z.infer<typeof NotificationQuerySchema>

export interface ReadNotificationDTO {
  id: string
  orgId: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export function toReadNotificationDTO(n: Notification): ReadNotificationDTO {
  return {
    id: n.id,
    orgId: n.orgId,
    userId: n.userId,
    type: n.type,
    payload: n.payload,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }
}
