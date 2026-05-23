import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import { IApplicationStageHistoryRepo } from '../../core/repo-interfaces/IApplicationStageHistoryRepo'
import { IOfferRepo } from '../../core/repo-interfaces/IOfferRepo'
import { ICandidateRepo } from '../../core/repo-interfaces/ICandidateRepo'
import { IJobRepo } from '../../core/repo-interfaces/IJobRepo'
import { IBlacklistRepo } from '../../core/repo-interfaces/IBlacklistRepo'
import { IJobFormRepo } from '../../core/repo-interfaces/IJobFormRepo'
import { IFileService } from '../../infrastructure/services/file.service'
import { IQueueService } from '../../infrastructure/services/queue.service'
import { Application, FormAnswer, PipelineStage } from '../../core/entities/application.entity'
import { OfferStatus } from '../../core/entities/offer.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { CandidateSource } from '../../core/entities/candidate.entity'
import {
  ReadApplicationDTO,
  InterviewerApplicationDTO,
  toReadApplicationDTO,
  toInterviewerApplicationDTO,
  buildFormAnswers,
  ApplicationQueryDTO,
} from '../../core/dtos/application.dto'
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
  InvalidStageTransitionError,
  ConflictError,
} from '../errors'
import { Membership } from './types'

const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  [PipelineStage.SCREENING]: [
    PipelineStage.INTERVIEW,
    PipelineStage.SPECIALIST_INTERVIEW,
    PipelineStage.REVIEW,
    PipelineStage.REJECTED,
  ],
  [PipelineStage.INTERVIEW]: [
    PipelineStage.SPECIALIST_INTERVIEW,
    PipelineStage.REVIEW,
    PipelineStage.REJECTED,
  ],
  [PipelineStage.SPECIALIST_INTERVIEW]: [PipelineStage.REVIEW, PipelineStage.REJECTED],
  [PipelineStage.REVIEW]: [
    PipelineStage.HM_APPROVED,
    PipelineStage.INTERVIEW,
    PipelineStage.SPECIALIST_INTERVIEW,
    PipelineStage.REJECTED,
  ],
  [PipelineStage.HM_APPROVED]: [PipelineStage.OFFER_SENT, PipelineStage.REJECTED],
  [PipelineStage.OFFER_SENT]: [PipelineStage.OFFER_ACCEPTED, PipelineStage.DECLINED],
  [PipelineStage.OFFER_ACCEPTED]: [PipelineStage.HIRED],
  [PipelineStage.REJECTED]: [
    PipelineStage.INTERVIEW,
    PipelineStage.SPECIALIST_INTERVIEW,
    PipelineStage.REVIEW,
  ],
  [PipelineStage.EARLY_REJECTION]: [],
  [PipelineStage.BLACKLISTED]: [],
  [PipelineStage.AI_EVALUATION]: [],
  [PipelineStage.HIRED]: [],
  [PipelineStage.DECLINED]: [],
}

@injectable()
export class ApplicationService {
  constructor(
    @inject(TOKENS.IApplicationRepo) private readonly appRepo: IApplicationRepo,
    @inject(TOKENS.IApplicationStageHistoryRepo) private readonly historyRepo: IApplicationStageHistoryRepo,
    @inject(TOKENS.IOfferRepo) private readonly offerRepo: IOfferRepo,
    @inject(TOKENS.IJobRepo) private readonly jobRepo: IJobRepo,
    @inject(TOKENS.ICandidateRepo) private readonly candidateRepo: ICandidateRepo,
    @inject(TOKENS.IBlacklistRepo) private readonly blacklistRepo: IBlacklistRepo,
    @inject(TOKENS.IJobFormRepo) private readonly jobFormRepo: IJobFormRepo,
    @inject(TOKENS.IFileService) private readonly fileService: IFileService,
    @inject(TOKENS.IQueueService) private readonly queue: IQueueService,
  ) { }

  async findByJob(jobId: string, query: ApplicationQueryDTO, membership: Membership) {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    const [items, total] = await this.appRepo.findByJob(jobId, query)
    return {
      data: items.map(toReadApplicationDTO),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async findById(applicationId: string, membership: Membership): Promise<ReadApplicationDTO | InterviewerApplicationDTO> {
    const jobApplication = await this.appRepo.findById(applicationId)
    if (!jobApplication) throw new NotFoundError('Application')
    // TODO: scope the query instead
    if (jobApplication.orgId !== membership.orgId) throw new ForbiddenError()

    if (membership.role === OrgRole.INTERVIEWER) {
      const { currentStage, interviews } = jobApplication
      const allowed = interviews.some((interview) =>
        (interview.stage as string === currentStage as string && interview.interviewerId === membership.userId)
      )
      if (!allowed) throw new ForbiddenError('Application not visible at this stage')
      return toInterviewerApplicationDTO(jobApplication)
    }
    return toReadApplicationDTO(jobApplication)
  }

  async createManual(jobId: string, candidateId: string, rawFormAnswers: Record<string, unknown>, resumeUrl: string, membership: Membership): Promise<ReadApplicationDTO> {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER) {
      throw new ForbiddenError('Only admins or recruiters can add applications')
    }
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()

    const candidate = await this.candidateRepo.findById(candidateId)
    if (!candidate) throw new NotFoundError('Candidate')
    if (candidate.orgId !== membership.orgId) throw new ForbiddenError()

    const existing = await this.appRepo.findByJobAndCandidate(jobId, candidateId)
    if (existing) throw new ConflictError('Candidate has already applied to this job')

    const blacklisted = await this.blacklistRepo.findActive(membership.orgId, candidateId)
    const stage = blacklisted ? PipelineStage.BLACKLISTED : PipelineStage.AI_EVALUATION

    // Denormalise the raw { fieldId: answer } map against the job form so the answers
    // are self-describing and never need a form re-fetch on read.
    const form = await this.jobFormRepo.findByJob(jobId)
    const formAnswers = form ? buildFormAnswers(form.fields, rawFormAnswers) : []

    const app = await this.appRepo.create({
      jobId,
      candidateId,
      orgId: membership.orgId,
      formAnswers,
      resumeUrl,
      currentStage: stage,
    })
    await this.historyRepo.create({
      applicationId: app.id,
      fromStage: null,
      toStage: stage,
      movedBy: membership.userId,
      note: 'Application created manually',
    })

    if (!blacklisted) {
      await this.queue.publish('hira:jobs:early_reject', {
        application_id: app.id,
        job_id: jobId,
        org_id: membership.orgId,
      })
    }
    return toReadApplicationDTO(app)
  }

  async move(applicationId: string, toStage: PipelineStage, note: string | undefined, membership: Membership): Promise<ReadApplicationDTO> {
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    this.assertNonInterviewer(membership)

    const allowed = VALID_TRANSITIONS[app.currentStage] ?? []
    if (!allowed.includes(toStage)) throw new InvalidStageTransitionError(app.currentStage, toStage)

    if (toStage === PipelineStage.HM_APPROVED) {
      if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.HIRING_MANAGER) {
        throw new ForbiddenError('Only admins or hiring managers can approve')
      }
      if (app.currentStage !== PipelineStage.REVIEW) {
        throw new InvalidStageTransitionError(app.currentStage, toStage)
      }
    }

    if (toStage === PipelineStage.OFFER_SENT) {
      const offer = await this.offerRepo.findByApplication(applicationId)
      if (!offer || offer.status !== OfferStatus.SENT) {
        throw new BusinessRuleError('Cannot move to Offer Sent without a sent offer')
      }
    }

    const updated = await this.appRepo.updateStage(applicationId, toStage)
    await this.historyRepo.create({
      applicationId,
      fromStage: app.currentStage,
      toStage,
      movedBy: membership.userId,
      note: note ?? null,
    })
    return toReadApplicationDTO(updated)
  }

  async reject(applicationId: string, note: string, membership: Membership): Promise<ReadApplicationDTO> {
    if (!note?.trim()) throw new BusinessRuleError('A note is required when rejecting a candidate')
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    this.assertNonInterviewer(membership)

    if (membership.role === OrgRole.HIRING_MANAGER && app.currentStage !== PipelineStage.REVIEW) {
      throw new ForbiddenError('Hiring managers can only reject from the Review stage')
    }

    await this.appRepo.update(applicationId, { rejectionNote: note })
    const updated = await this.appRepo.updateStage(applicationId, PipelineStage.REJECTED)
    await this.historyRepo.create({
      applicationId,
      fromStage: app.currentStage,
      toStage: PipelineStage.REJECTED,
      movedBy: membership.userId,
      note,
    })
    return toReadApplicationDTO(updated)
  }

  async approveFromReview(applicationId: string, membership: Membership): Promise<ReadApplicationDTO> {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.HIRING_MANAGER) {
      throw new ForbiddenError('Only admins or hiring managers can approve')
    }
    return this.move(applicationId, PipelineStage.HM_APPROVED, undefined, membership)
  }

  async hire(applicationId: string, membership: Membership): Promise<ReadApplicationDTO> {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER) {
      throw new ForbiddenError('Only admins or recruiters can mark hired')
    }
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    if (app.currentStage !== PipelineStage.OFFER_ACCEPTED) {
      throw new InvalidStageTransitionError(app.currentStage, PipelineStage.HIRED)
    }
    await this.candidateRepo.update(app.candidateId, { isHired: true })
    const updated = await this.appRepo.updateStage(applicationId, PipelineStage.HIRED)
    await this.historyRepo.create({
      applicationId,
      fromStage: app.currentStage,
      toStage: PipelineStage.HIRED,
      movedBy: membership.userId,
      note: 'Candidate marked as hired',
    })
    return toReadApplicationDTO(updated)
  }

  async getStageHistory(applicationId: string, membership: Membership) {
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    this.assertNonInterviewer(membership)
    return this.historyRepo.findByApplication(applicationId)
  }

  /**
   * Used internally during public candidate applications submitted via the careers page.
   * Creates a candidate if one does not exist, uploads resume, dispatches AI early-rejection.
   */
  async ingestPublicApplication(params: {
    orgId: string
    jobId: string
    formAnswers: FormAnswer[]
    candidate: { email: string; fullName: string; phone?: string | null }
    resumeBuffer: Buffer
    resumeExt: string
  }): Promise<Application> {
    const { orgId, jobId, formAnswers, candidate, resumeBuffer, resumeExt } = params

    let dbCandidate = await this.candidateRepo.findByOrgAndEmail(orgId, candidate.email.toLowerCase())
    if (!dbCandidate && candidate.phone) {
      dbCandidate = await this.candidateRepo.findByOrgAndPhone(orgId, candidate.phone)
    }
    if (!dbCandidate) {
      dbCandidate = await this.candidateRepo.create({
        orgId,
        email: candidate.email.toLowerCase(),
        fullName: candidate.fullName,
        phone: candidate.phone ?? null,
        source: CandidateSource.CAREERS_PAGE,
      })
    }

    const existing = await this.appRepo.findByJobAndCandidate(jobId, dbCandidate.id)
    if (existing) throw new ConflictError('You have already applied to this position')

    const resumeKey = `resumes/${orgId}/${jobId}/${dbCandidate.id}.${resumeExt}`
    const resumeUrl = await this.fileService.upload(resumeBuffer, resumeKey, 'application/octet-stream')

    const blacklisted = await this.blacklistRepo.findActive(orgId, dbCandidate.id)
    const stage = blacklisted ? PipelineStage.BLACKLISTED : PipelineStage.AI_EVALUATION

    const app = await this.appRepo.create({
      jobId,
      candidateId: dbCandidate.id,
      orgId,
      formAnswers,
      resumeUrl,
      currentStage: stage,
    })
    await this.historyRepo.create({
      applicationId: app.id,
      fromStage: null,
      toStage: stage,
      movedBy: null,
      note: 'Public application submission',
    })

    if (!blacklisted) {
      await this.queue.publish('hira:jobs:early_reject', {
        application_id: app.id,
        job_id: jobId,
        org_id: orgId,
      })
    }
    return app
  }

  private assertNonInterviewer(membership: Membership): void {
    if (membership.role === OrgRole.INTERVIEWER) {
      throw new ForbiddenError('Interviewers cannot move applications')
    }
  }
}
