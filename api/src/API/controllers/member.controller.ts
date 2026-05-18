import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { MemberService } from '../../application/services/member.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class MemberController {
  constructor(@inject(MemberService) private readonly service: MemberService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.listMembers(String(req.params.orgId), req.membership)
    res.json({ data: result })
  }

  updateRole = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.updateRole(String(req.params.orgId), String(req.params.userId), req.body, req.membership)
    res.json({ data: result })
  }

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.removeMember(String(req.params.orgId), String(req.params.userId), req.membership)
    res.status(204).send()
  }
}
