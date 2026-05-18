import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { CandidateService } from '../../application/services/candidate.service'
import { CandidateQuerySchema } from '../../core/dtos/candidate.dto'
import { UnauthorizedError } from '../../application/errors'
import { getValidated } from '../middlewares/validate.middleware'

@injectable()
export class CandidateController {
  constructor(@inject(CandidateService) private readonly service: CandidateService) {}

  findAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const query = getValidated(req, CandidateQuerySchema)
    const result = await this.service.findAll(query, req.membership)
    res.json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } })
  }

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.findById(String(req.params.candidateId), req.membership) })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.status(201).json({ data: await this.service.create(req.body, req.membership) })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.update(String(req.params.candidateId), req.body, req.membership) })
  }

  blacklist = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.blacklist(String(req.params.candidateId), req.body, req.membership)
    res.status(201).send()
  }

  unblacklist = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.unblacklist(String(req.params.candidateId), req.membership)
    res.status(204).send()
  }

  suggest = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.suggest(String(req.params.candidateId), req.body, req.membership)
    res.status(202).json({ data: { sent: true } })
  }
}
