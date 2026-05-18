import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { PublicService } from '../../application/services/public.service'
import { BadRequestError } from '../../application/errors'

@injectable()
export class PublicController {
  constructor(@inject(PublicService) private readonly service: PublicService) {}

  getCareers = async (req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.service.getCareersPage(String(req.params.orgSlug)) })
  }

  getJob = async (req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.service.getJob(String(req.params.orgSlug), String(req.params.jobId)) })
  }

  getJobForm = async (req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.service.getJobForm(String(req.params.orgSlug), String(req.params.jobId)) })
  }

  apply = async (req: Request, res: Response): Promise<void> => {
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) throw new BadRequestError('Resume file is required')

    let answers: Record<string, unknown>
    try {
      answers = JSON.parse((req.body?.answers as string) ?? '{}')
    } catch {
      throw new BadRequestError('Invalid answers payload')
    }
    const ext = (file.originalname.split('.').pop() ?? 'pdf').toLowerCase()
    await this.service.apply(String(req.params.orgSlug), String(req.params.jobId), answers, file.buffer, ext)
    res.status(201).json({ data: { ok: true } })
  }
}
