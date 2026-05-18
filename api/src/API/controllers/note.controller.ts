import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { NoteService } from '../../application/services/note.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class NoteController {
  constructor(@inject(NoteService) private readonly service: NoteService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.list(String(req.params.applicationId), req.membership) })
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.status(201).json({ data: await this.service.create(String(req.params.applicationId), req.body, req.membership) })
  }

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    res.json({ data: await this.service.update(String(req.params.noteId), req.body, req.membership) })
  }

  delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.membership) throw new UnauthorizedError()
    await this.service.delete(String(req.params.noteId), req.membership)
    res.status(204).send()
  }
}
