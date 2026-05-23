import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { InterviewService } from '../../application/services/interview.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class InterviewController {
  constructor(@inject(InterviewService) private readonly service: InterviewService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.list(req.membership) })
  }

  listByApplication = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({
      data: await this.service.listByApplication(String(req.params.applicationId), req.membership),
    })
  }

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.findById(String(req.params.interviewId), req.membership) })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.status(201).json({
      data: await this.service.create(String(req.params.applicationId), req.body, req.membership),
    })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.update(String(req.params.interviewId), req.body, req.membership) })
  }

  cancel = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.cancel(String(req.params.interviewId), req.membership) })
  }

  getFeedback = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.getFeedback(String(req.params.interviewId), req.membership) })
  }

  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.status(201).json({
      data: await this.service.submitFeedback(String(req.params.interviewId), req.body, req.membership),
    })
  }
}
