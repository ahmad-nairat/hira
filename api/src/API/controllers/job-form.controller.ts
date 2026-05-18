import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { JobFormService } from '../../application/services/job-form.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class JobFormController {
  constructor(@inject(JobFormService) private readonly service: JobFormService) {}

  findOne = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.get(String(req.params.jobId), req.membership)
    res.json({ data: result })
  }

  save = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    const result = await this.service.save(String(req.params.jobId), req.body, req.membership)
    res.json({ data: result })
  }
}
