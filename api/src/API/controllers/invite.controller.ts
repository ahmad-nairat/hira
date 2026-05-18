import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { InviteService } from '../../application/services/invite.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class InviteController {
  constructor(@inject(InviteService) private readonly service: InviteService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.list(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.create(String(req.params.orgId), req.body, req.membership)
    res.status(201).json({ data: result })
  }

  revoke = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.revoke(String(req.params.orgId), String(req.params.inviteId), req.membership)
    res.status(204).send()
  }

  resend = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.resend(String(req.params.orgId), String(req.params.inviteId), req.membership)
    res.json({ data: result })
  }
}
