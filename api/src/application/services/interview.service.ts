import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IInterviewRepo } from '../../core/repo-interfaces/IInterviewRepo'
import { IInterviewFeedbackRepo } from '../../core/repo-interfaces/IInterviewFeedbackRepo'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import { INotificationRepo } from '../../core/repo-interfaces/INotificationRepo'
import { ISseService } from '../../infrastructure/services/sse.service'
import {
  CreateInterviewDTO,
  UpdateInterviewDTO,
  SubmitFeedbackDTO,
  ReadInterviewDTO,
  ReadInterviewFeedbackDTO,
  toReadInterviewDTO,
  toReadInterviewFeedbackDTO,
} from '../../core/dtos/interview.dto'
import { InterviewStatus } from '../../core/entities/interview.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotificationType } from '../../core/entities/notification.entity'
import { NotFoundError, ForbiddenError, ConflictError } from '../errors'
import { Membership } from './types'

@injectable()
export class InterviewService {
  constructor(
    @inject(TOKENS.IInterviewRepo) private readonly interviewRepo: IInterviewRepo,
    @inject(TOKENS.IInterviewFeedbackRepo) private readonly feedbackRepo: IInterviewFeedbackRepo,
    @inject(TOKENS.IApplicationRepo) private readonly appRepo: IApplicationRepo,
    @inject(TOKENS.INotificationRepo) private readonly notificationRepo: INotificationRepo,
    @inject(TOKENS.ISseService) private readonly sse: ISseService,
  ) {}

  async list(membership: Membership): Promise<ReadInterviewDTO[]> {
    if (membership.role === OrgRole.INTERVIEWER) {
      const interviews = await this.interviewRepo.findByInterviewer(membership.userId)
      return interviews.filter((i) => i.orgId === membership.orgId).map(toReadInterviewDTO)
    }
    const interviews = await this.interviewRepo.findByOrg(membership.orgId)
    return interviews.map(toReadInterviewDTO)
  }

  async findById(interviewId: string, membership: Membership): Promise<ReadInterviewDTO> {
    const i = await this.interviewRepo.findById(interviewId)
    if (!i) throw new NotFoundError('Interview')
    if (i.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER && i.interviewerId !== membership.userId) {
      throw new ForbiddenError('Not your interview')
    }
    return toReadInterviewDTO(i)
  }

  async create(applicationId: string, dto: CreateInterviewDTO, membership: Membership): Promise<ReadInterviewDTO> {
    this.assertCanSchedule(membership)
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()

    const interview = await this.interviewRepo.create({
      applicationId,
      orgId: membership.orgId,
      stage: dto.stage,
      interviewerId: dto.interviewerId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      meetingType: dto.meetingType,
      meetingLink: dto.meetingLink ?? null,
      meetingAddress: dto.meetingAddress ?? null,
    })

    await this.notify(dto.interviewerId, membership.orgId, NotificationType.ASSIGNMENT, {
      interviewId: interview.id,
      applicationId,
    })
    return toReadInterviewDTO(interview)
  }

  async update(interviewId: string, dto: UpdateInterviewDTO, membership: Membership): Promise<ReadInterviewDTO> {
    this.assertCanSchedule(membership)
    const interview = await this.interviewRepo.findById(interviewId)
    if (!interview) throw new NotFoundError('Interview')
    if (interview.orgId !== membership.orgId) throw new ForbiddenError()

    const patch: Record<string, unknown> = { ...dto }
    if (dto.scheduledAt) patch.scheduledAt = new Date(dto.scheduledAt)
    const updated = await this.interviewRepo.update(interviewId, patch)

    if (dto.interviewerId && dto.interviewerId !== interview.interviewerId) {
      await this.notify(dto.interviewerId, membership.orgId, NotificationType.ASSIGNMENT, {
        interviewId,
        applicationId: interview.applicationId,
      })
    }
    return toReadInterviewDTO(updated)
  }

  async cancel(interviewId: string, membership: Membership): Promise<ReadInterviewDTO> {
    this.assertCanSchedule(membership)
    const interview = await this.interviewRepo.findById(interviewId)
    if (!interview) throw new NotFoundError('Interview')
    if (interview.orgId !== membership.orgId) throw new ForbiddenError()
    const updated = await this.interviewRepo.updateStatus(interviewId, InterviewStatus.CANCELLED)
    return toReadInterviewDTO(updated)
  }

  async getFeedback(interviewId: string, membership: Membership): Promise<ReadInterviewFeedbackDTO | null> {
    const interview = await this.interviewRepo.findById(interviewId)
    if (!interview) throw new NotFoundError('Interview')
    if (interview.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER && interview.interviewerId !== membership.userId) {
      throw new ForbiddenError('Not your interview')
    }
    const fb = await this.feedbackRepo.findByInterview(interviewId)
    return fb ? toReadInterviewFeedbackDTO(fb) : null
  }

  async submitFeedback(interviewId: string, dto: SubmitFeedbackDTO, membership: Membership): Promise<ReadInterviewFeedbackDTO> {
    const interview = await this.interviewRepo.findById(interviewId)
    if (!interview) throw new NotFoundError('Interview')
    if (interview.orgId !== membership.orgId) throw new ForbiddenError()
    if (interview.interviewerId !== membership.userId && membership.role !== OrgRole.ADMIN) {
      throw new ForbiddenError('Only the assigned interviewer can submit feedback')
    }
    const existing = await this.feedbackRepo.findByInterview(interviewId)
    if (existing) throw new ConflictError('Feedback already submitted for this interview')

    const fb = await this.feedbackRepo.create({
      interviewId,
      submittedBy: membership.userId,
      rating: dto.rating,
      notes: dto.notes,
      recommendation: dto.recommendation,
    })
    await this.interviewRepo.updateStatus(interviewId, InterviewStatus.COMPLETED)

    // Notify recruiter and HM on the application's job
    const app = await this.appRepo.findById(interview.applicationId)
    if (app?.job?.recruiterId) {
      await this.notify(app.job.recruiterId, membership.orgId, NotificationType.NEW_FEEDBACK, {
        interviewId,
        applicationId: interview.applicationId,
      })
    }
    if (app?.job?.hiringManagerId) {
      await this.notify(app.job.hiringManagerId, membership.orgId, NotificationType.NEW_FEEDBACK, {
        interviewId,
        applicationId: interview.applicationId,
      })
    }
    return toReadInterviewFeedbackDTO(fb)
  }

  private async notify(userId: string, orgId: string, type: NotificationType, payload: Record<string, unknown>): Promise<void> {
    const n = await this.notificationRepo.create({ userId, orgId, type, payload })
    this.sse.push(userId, { id: n.id, type, payload, createdAt: n.createdAt.toISOString() })
  }

  private assertCanSchedule(membership: Membership): void {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER && membership.role !== OrgRole.HIRING_MANAGER) {
      throw new ForbiddenError('Only admins, recruiters or hiring managers can schedule interviews')
    }
  }
}
