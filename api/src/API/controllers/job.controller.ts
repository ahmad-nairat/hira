import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { JobService } from '../../application/services/job.service'
import { JobQuerySchema } from '../../core/dtos/job.dto'
import { UnauthorizedError } from '../../application/errors'
import { getValidated } from '../middlewares/validate.middleware'

@injectable()
export class JobController {
  constructor(@inject(JobService) private readonly service: JobService) {}

  findAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const query = getValidated(req, JobQuerySchema)
    const result = await this.service.findAll(query, req.membership)
    res.json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } })
  }

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.findById(String(req.params.jobId), req.membership)
    res.json({ data: result })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.create(req.body, req.membership)
    res.status(201).json({ data: result })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.update(String(req.params.jobId), req.body, req.membership)
    res.json({ data: result })
  }

  publish = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.publish(String(req.params.jobId), req.membership)
    res.json({ data: result })
  }

  close = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.close(String(req.params.jobId), req.membership) })
  }

  archive = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.archive(String(req.params.jobId), req.membership) })
  }

  rescore = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.rescore(String(req.params.jobId), req.membership)
    res.status(202).json({ data: { queued: true } })
  }

  reevaluateRejections = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.reevaluateRejections(String(req.params.jobId), req.membership)
    res.status(202).json({ data: { queued: true } })
  }
}
