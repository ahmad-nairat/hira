import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { INotificationRepo } from '../../core/repo-interfaces/INotificationRepo'
import {
  NotificationQueryDTO,
  ReadNotificationDTO,
  toReadNotificationDTO,
} from '../../core/dtos/notification.dto'
import { NotFoundError, ForbiddenError } from '../errors'
import { Membership } from './types'

@injectable()
export class NotificationService {
  constructor(@inject(TOKENS.INotificationRepo) private readonly repo: INotificationRepo) {}

  async list(query: NotificationQueryDTO, membership: Membership): Promise<{ data: ReadNotificationDTO[]; total: number; page: number; limit: number; unreadCount: number }> {
    const [items, total] = await this.repo.findByUser(membership.userId, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
    })
    const unreadCount = await this.repo.countUnread(membership.userId)
    return {
      data: items.map(toReadNotificationDTO),
      total,
      page: query.page,
      limit: query.limit,
      unreadCount,
    }
  }

  async markRead(id: string, membership: Membership): Promise<ReadNotificationDTO> {
    const n = await this.repo.findById(id)
    if (!n) throw new NotFoundError('Notification')
    if (n.userId !== membership.userId) throw new ForbiddenError()
    const updated = await this.repo.markRead(id)
    return toReadNotificationDTO(updated)
  }

  async markAllRead(membership: Membership): Promise<void> {
    await this.repo.markAllRead(membership.userId)
  }
}
