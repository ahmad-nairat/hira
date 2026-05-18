import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { ApplicationService } from '../../application/services/application.service'
import { ApplicationQuerySchema } from '../../core/dtos/application.dto'
import { UnauthorizedError, BadRequestError } from '../../application/errors'
import { getValidated } from '../middlewares/validate.middleware'

@injectable()
export class ApplicationController {
  constructor(@inject(ApplicationService) private readonly service: ApplicationService) {}

  findByJob = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const query = getValidated(req, ApplicationQuerySchema)
    const result = await this.service.findByJob(String(req.params.jobId), query, req.membership)
    res.json({ data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } })
  }

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.findById(String(req.params.applicationId), req.membership) })
  }

  move = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.move(String(req.params.applicationId), req.body.toStage, req.body.note, req.membership)
    res.json({ data: result })
  }

  reject = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.reject(String(req.params.applicationId), req.body.note, req.membership) })
  }

  approve = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.approveFromReview(String(req.params.applicationId), req.membership) })
  }

  hire = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.hire(String(req.params.applicationId), req.membership) })
  }

  stageHistory = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.getStageHistory(String(req.params.applicationId), req.membership) })
  }

  createManual = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const { candidateId, formAnswers, resumeUrl } = req.body
    if (!candidateId || !resumeUrl) throw new BadRequestError('candidateId and resumeUrl are required')
    res.status(201).json({
      data: await this.service.createManual(String(req.params.jobId), candidateId, formAnswers ?? {}, resumeUrl, req.membership),
    })
  }
}
