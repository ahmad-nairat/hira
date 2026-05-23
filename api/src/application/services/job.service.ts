import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IJobRepo } from '../../core/repo-interfaces/IJobRepo'
import { IJobFormRepo } from '../../core/repo-interfaces/IJobFormRepo'
import { JobStatus } from '../../core/entities/job.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { CreateJobDTO, UpdateJobDTO, JobQueryDTO, ReadJobDTO, toReadJobDTO } from '../../core/dtos/job.dto'
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../errors'
import { Membership } from './types'
import { IQueueService } from '../../infrastructure/services/queue.service'

@injectable()
export class JobService {
  constructor(
    @inject(TOKENS.IJobRepo) private readonly jobRepo: IJobRepo,
    @inject(TOKENS.IJobFormRepo) private readonly jobFormRepo: IJobFormRepo,
    @inject(TOKENS.IQueueService) private readonly queue: IQueueService,
  ) {}

  async findAll(query: JobQueryDTO, membership: Membership): Promise<{ data: ReadJobDTO[]; total: number; page: number; limit: number }> {
    const [jobs, total] = await this.jobRepo.findAll(query, membership.orgId)
    return {
      data: jobs.map(toReadJobDTO),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async findById(jobId: string, membership: Membership): Promise<ReadJobDTO> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    return toReadJobDTO(job)
  }

  async create(dto: CreateJobDTO, membership: Membership): Promise<ReadJobDTO> {
    this.assertCanManageJobs(membership)
    const job = await this.jobRepo.create({
      ...dto,
      orgId: membership.orgId,
      recruiterId: membership.userId,
      hiringManagerId: dto.hiringManagerId ?? null,
      salaryMin: dto.salaryMin ?? null,
      salaryMax: dto.salaryMax ?? null,
      salaryCurrency: dto.salaryCurrency ?? null,
      status: JobStatus.DRAFT,
    })
    return toReadJobDTO(job)
  }

  async update(jobId: string, dto: UpdateJobDTO, membership: Membership): Promise<ReadJobDTO> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.RECRUITER && job.recruiterId !== membership.userId) {
      throw new ForbiddenError('Recruiters can only update their own jobs')
    }

    const publicFacing: (keyof UpdateJobDTO)[] = ['title', 'description', 'location', 'type', 'salaryMin', 'salaryMax', 'salaryCurrency']
    const changesPublic = publicFacing.some((f) => f in dto)
    const patch: Record<string, unknown> = { ...dto }

    // Drop a live job back to draft when its public-facing surface changes.
    if (job.status === JobStatus.PUBLISHED && changesPublic) {
      patch.status = JobStatus.DRAFT
    }
    // Stale-flags apply whenever the job has applications that may have been
    // scored/screened under the previous AI settings. A job acquires that
    // population the moment it is first published, so `publishedAt != null`
    // is the right gate — not "is the job currently published?". Editing
    // criteria/scoring on a draft that was previously published must still
    // raise the flag, even across multi-PATCH saves where an earlier patch
    // already flipped the job back to draft.
    if (job.publishedAt != null) {
      if ('rejectionCriteria' in dto) patch.hasOutdatedRejections = true
      if ('scoringInstructions' in dto || this.scoringWeightChanged(dto)) patch.hasOutdatedScores = true
    }

    const updated = await this.jobRepo.update(jobId, patch)
    return toReadJobDTO(updated)
  }

  async publish(jobId: string, membership: Membership): Promise<ReadJobDTO> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.RECRUITER && job.recruiterId !== membership.userId) {
      throw new ForbiddenError('Recruiters can only publish their own jobs')
    }

    const form = await this.jobFormRepo.findByJob(jobId)
    if (!form || !form.fields?.some((f) => f.isResume)) {
      throw new BusinessRuleError('A job cannot be published without a completed form (including a resume field)')
    }

    const updated = await this.jobRepo.update(jobId, {
      status: JobStatus.PUBLISHED,
      publishedAt: job.publishedAt ?? new Date(),
    })

    // Always refresh the structured analysis — it's the source of truth for
    // the scorer and early-rejection workers, and re-running is cheap.
    await this.queue.publish('hira:jobs:analyze', { job_id: jobId, org_id: membership.orgId })

    // Republishing does NOT auto-dispatch bulk rescore or re-evaluation, and
    // does not clear the outdated flags. The recruiter triggers those
    // explicitly via the Rescore / Re-evaluate rejections actions, which
    // gives them control over when the LLM workload runs and lets them
    // verify their edits look right before paying for a bulk pass.

    return toReadJobDTO(updated)
  }

  async close(jobId: string, membership: Membership): Promise<ReadJobDTO> {
    return this.transition(jobId, JobStatus.CLOSED, membership)
  }

  async archive(jobId: string, membership: Membership): Promise<ReadJobDTO> {
    return this.transition(jobId, JobStatus.ARCHIVED, membership)
  }

  async rescore(jobId: string, membership: Membership): Promise<void> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (job.status !== JobStatus.PUBLISHED) throw new BusinessRuleError('Job must be published to rescore')
    await this.queue.publish('hira:jobs:score_bulk', { job_id: jobId, org_id: membership.orgId, bulk: true })
    await this.jobRepo.update(jobId, { hasOutdatedScores: false })
  }

  async reevaluateRejections(jobId: string, membership: Membership): Promise<void> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (job.status !== JobStatus.PUBLISHED) throw new BusinessRuleError('Job must be published')
    await this.queue.publish('hira:jobs:reevaluate_rejections', { job_id: jobId, org_id: membership.orgId, bulk: true })
    await this.jobRepo.update(jobId, { hasOutdatedRejections: false })
  }

  private async transition(jobId: string, status: JobStatus, membership: Membership): Promise<ReadJobDTO> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.RECRUITER && job.recruiterId !== membership.userId) {
      throw new ForbiddenError('Recruiters can only modify their own jobs')
    }
    const updated = await this.jobRepo.update(jobId, { status })
    return toReadJobDTO(updated)
  }

  private scoringWeightChanged(dto: UpdateJobDTO): boolean {
    return (
      'scoringEducation' in dto ||
      'scoringSkills' in dto ||
      'scoringExperience' in dto ||
      'scoringCerts' in dto
    )
  }

  private assertCanManageJobs(membership: Membership): void {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER) {
      throw new ForbiddenError('Only admins or recruiters can create jobs')
    }
  }
}
