import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { INoteRepo } from '../../core/repo-interfaces/INoteRepo'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import { IInterviewRepo } from '../../core/repo-interfaces/IInterviewRepo'
import { CreateNoteDTO, UpdateNoteDTO, ReadNoteDTO, toReadNoteDTO } from '../../core/dtos/note.dto'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { PipelineStage } from '../../core/entities/application.entity'
import { NotFoundError, ForbiddenError } from '../errors'
import { Membership } from './types'

@injectable()
export class NoteService {
  constructor(
    @inject(TOKENS.INoteRepo) private readonly noteRepo: INoteRepo,
    @inject(TOKENS.IApplicationRepo) private readonly appRepo: IApplicationRepo,
    @inject(TOKENS.IInterviewRepo) private readonly interviewRepo: IInterviewRepo,
  ) {}

  async list(applicationId: string, membership: Membership): Promise<ReadNoteDTO[]> {
    await this.assertCanViewApplication(applicationId, membership)
    const notes = await this.noteRepo.findByApplication(applicationId)
    return notes.map(toReadNoteDTO)
  }

  async create(applicationId: string, dto: CreateNoteDTO, membership: Membership): Promise<ReadNoteDTO> {
    await this.assertCanComment(applicationId, membership)
    const note = await this.noteRepo.create({
      applicationId,
      authorId: membership.userId,
      content: dto.content,
    })
    return toReadNoteDTO(note)
  }

  async update(noteId: string, dto: UpdateNoteDTO, membership: Membership): Promise<ReadNoteDTO> {
    const note = await this.noteRepo.findById(noteId)
    if (!note) throw new NotFoundError('Note')
    if (note.authorId !== membership.userId && membership.role !== OrgRole.ADMIN) {
      throw new ForbiddenError('You can only edit your own notes')
    }
    const updated = await this.noteRepo.update(noteId, dto.content)
    return toReadNoteDTO(updated)
  }

  async delete(noteId: string, membership: Membership): Promise<void> {
    const note = await this.noteRepo.findById(noteId)
    if (!note) throw new NotFoundError('Note')
    if (note.authorId !== membership.userId && membership.role !== OrgRole.ADMIN) {
      throw new ForbiddenError('You can only delete your own notes')
    }
    await this.noteRepo.delete(noteId)
  }

  private async assertCanViewApplication(applicationId: string, membership: Membership): Promise<void> {
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER) {
      const interviews = await this.interviewRepo.findByApplication(applicationId)
      const own = interviews.some((i) => i.interviewerId === membership.userId)
      if (!own) throw new ForbiddenError('You can only view notes for your own interviews')
      const allowed = app.currentStage === PipelineStage.INTERVIEW || app.currentStage === PipelineStage.SPECIALIST_INTERVIEW
      if (!allowed) throw new ForbiddenError('Application not visible at this stage')
    }
  }

  private async assertCanComment(applicationId: string, membership: Membership): Promise<void> {
    if (membership.role === OrgRole.INTERVIEWER) {
      throw new ForbiddenError('Interviewers cannot add notes')
    }
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
  }
}
