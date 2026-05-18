import { Notification, NotificationType } from '../entities/notification.entity'

export interface CreateNotificationInput {
  orgId: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
}

export interface INotificationRepo {
  findById(id: string): Promise<Notification | null>
  findByUser(userId: string, opts: { page: number; limit: number; unreadOnly?: boolean }): Promise<[Notification[], number]>
  create(data: CreateNotificationInput): Promise<Notification>
  markRead(id: string): Promise<Notification>
  markAllRead(userId: string): Promise<void>
  countUnread(userId: string): Promise<number>
}
