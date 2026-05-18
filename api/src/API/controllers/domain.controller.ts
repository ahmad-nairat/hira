import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { DomainService } from '../../application/services/domain.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class DomainController {
  constructor(@inject(DomainService) private readonly service: DomainService) {}

  find = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.findForOrg(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.create(String(req.params.orgId), req.body, req.membership)
    res.status(201).json({ data: result })
  }

  delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.delete(String(req.params.orgId), req.membership)
    res.status(204).send()
  }

  verify = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.verify(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }
}
