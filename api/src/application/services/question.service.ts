import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IGeneratedQuestionsRepo } from '../../core/repo-interfaces/IGeneratedQuestionsRepo'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import { IInterviewRepo } from '../../core/repo-interfaces/IInterviewRepo'
import { IQueueService } from '../../infrastructure/services/queue.service'
import {
  GenerateQuestionsDTO,
  UpdateAnswersDTO,
  ReadGeneratedQuestionsDTO,
  toReadGeneratedQuestionsDTO,
} from '../../core/dtos/question.dto'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotFoundError, ForbiddenError } from '../errors'
import { Membership } from './types'

@injectable()
export class QuestionService {
  constructor(
    @inject(TOKENS.IGeneratedQuestionsRepo) private readonly questionRepo: IGeneratedQuestionsRepo,
    @inject(TOKENS.IApplicationRepo) private readonly appRepo: IApplicationRepo,
    @inject(TOKENS.IInterviewRepo) private readonly interviewRepo: IInterviewRepo,
    @inject(TOKENS.IQueueService) private readonly queue: IQueueService,
  ) {}

  async list(applicationId: string, membership: Membership): Promise<ReadGeneratedQuestionsDTO[]> {
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER) {
      const interviews = await this.interviewRepo.findByApplication(applicationId)
      if (!interviews.some((i) => i.interviewerId === membership.userId)) {
        throw new ForbiddenError('You can only see questions for your own interviews')
      }
    }
    const questions = await this.questionRepo.findByApplication(applicationId)
    return questions.map(toReadGeneratedQuestionsDTO)
  }

  async generate(applicationId: string, dto: GenerateQuestionsDTO, membership: Membership): Promise<void> {
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER) {
      const interviews = await this.interviewRepo.findByApplication(applicationId)
      if (!interviews.some((i) => i.interviewerId === membership.userId)) {
        throw new ForbiddenError('You can only request questions for your own interviews')
      }
    }
    await this.queue.publish('hira:jobs:generate_questions', {
      application_id: applicationId,
      job_id: app.jobId,
      org_id: app.orgId,
      interview_id: dto.interviewId ?? null,
      instructions: dto.instructions ?? '',
      generated_by: membership.userId,
    })
  }

  async updateAnswers(questionsId: string, dto: UpdateAnswersDTO, membership: Membership): Promise<ReadGeneratedQuestionsDTO> {
    const q = await this.questionRepo.findById(questionsId)
    if (!q) throw new NotFoundError('Questions')
    const app = await this.appRepo.findById(q.applicationId)
    if (!app || app.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.INTERVIEWER && q.generatedBy !== membership.userId) {
      throw new ForbiddenError('Interviewers can only edit their own question sets')
    }
    const updated = await this.questionRepo.updateAnswers(questionsId, dto.questions)
    return toReadGeneratedQuestionsDTO(updated)
  }
}
