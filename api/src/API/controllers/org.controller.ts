import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { OrgService } from '../../application/services/org.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class OrgController {
  constructor(@inject(OrgService) private readonly service: OrgService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const result = await this.service.create(req.body, req.user.id)
    res.status(201).json({ data: result })
  }

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.findById(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.update(String(req.params.orgId), req.body, req.membership)
    res.json({ data: result })
  }

  updateBranding = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.updateBranding(String(req.params.orgId), req.body, req.membership)
    res.json({ data: result })
  }

  updateScoring = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.updateScoring(String(req.params.orgId), req.body, req.membership)
    res.json({ data: result })
  }

  updateAutoJoin = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.updateAutoJoin(String(req.params.orgId), req.body, req.membership)
    res.json({ data: result })
  }

  delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.delete(String(req.params.orgId), req.membership)
    res.status(204).send()
  }
}
