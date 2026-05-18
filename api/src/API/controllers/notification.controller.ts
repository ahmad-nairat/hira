import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { NotificationService } from '../../application/services/notification.service'
import { ISseService } from '../../infrastructure/services/sse.service'
import { TOKENS } from '../../infrastructure/di/tokens'
import { NotificationQuerySchema } from '../../core/dtos/notification.dto'
import { UnauthorizedError } from '../../application/errors'
import { getValidated } from '../middlewares/validate.middleware'

@injectable()
export class NotificationController {
  constructor(
    @inject(NotificationService) private readonly service: NotificationService,
    @inject(TOKENS.ISseService) private readonly sse: ISseService,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const query = getValidated(req, NotificationQuerySchema)
    const result = await this.service.list(query, req.membership)
    res.json({
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit, unreadCount: result.unreadCount },
    })
  }

  markRead = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.markRead(String(req.params.notificationId), req.membership) })
  }

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.markAllRead(req.membership)
    res.status(204).send()
  }

  stream = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const userId = req.membership.userId
    this.sse.register(userId, res)
    req.on('close', () => this.sse.remove(userId, res))
  }
}
