import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { QuestionService } from '../../application/services/question.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class QuestionController {
  constructor(@inject(QuestionService) private readonly service: QuestionService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.list(String(req.params.applicationId), req.membership) })
  }

  generate = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.generate(String(req.params.applicationId), req.body, req.membership)
    res.status(202).json({ data: { queued: true } })
  }

  updateAnswers = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.updateAnswers(String(req.params.questionsId), req.body, req.membership) })
  }
}
