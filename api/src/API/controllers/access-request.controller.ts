import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { AccessRequestService } from '../../application/services/access-request.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class AccessRequestController {
  constructor(@inject(AccessRequestService) private readonly service: AccessRequestService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.list(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }

  approve = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.approve(String(req.params.orgId), String(req.params.requestId), req.membership)
    res.status(204).send()
  }

  reject = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.reject(String(req.params.orgId), String(req.params.requestId), req.membership)
    res.status(204).send()
  }
}
