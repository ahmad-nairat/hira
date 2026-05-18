import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { OfferService } from '../../application/services/offer.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class OfferController {
  constructor(@inject(OfferService) private readonly service: OfferService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.status(201).json({
      data: await this.service.create(String(req.params.applicationId), req.body, req.membership),
    })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.update(String(req.params.applicationId), req.body, req.membership) })
  }

  send = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.send(String(req.params.applicationId), req.membership) })
  }

  getPublic = async (req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.service.getPublicByToken(String(req.params.token)) })
  }

  respond = async (req: Request, res: Response): Promise<void> => {
    await this.service.respond(String(req.params.token), req.body.decision)
    res.json({ data: { ok: true } })
  }

  resend = async (req: Request, res: Response): Promise<void> => {
    await this.service.resend(req.body.email)
    res.json({ data: { ok: true } })
  }
}
