import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Notification } from '../../core/entities/notification.entity'
import { INotificationRepo, CreateNotificationInput } from '../../core/repo-interfaces/INotificationRepo'

@injectable()
export class NotificationRepo implements INotificationRepo {
  private get repo(): Repository<Notification> {
    return AppDataSource.getRepository(Notification)
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByUser(userId: string, opts: { page: number; limit: number; unreadOnly?: boolean }): Promise<[Notification[], number]> {
    const qb = this.repo.createQueryBuilder('n').where('n.userId = :userId', { userId })
    if (opts.unreadOnly) qb.andWhere('n.isRead = false')
    return qb
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .orderBy('n.createdAt', 'DESC')
      .getManyAndCount()
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    return this.repo.save(this.repo.create(data))
  }

  async markRead(id: string): Promise<Notification> {
    await this.repo.update({ id }, { isRead: true })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Notification not found after update')
    return updated
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true })
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } })
  }
}
