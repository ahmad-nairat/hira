import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IJobRepo } from '../../core/repo-interfaces/IJobRepo'
import { IJobFormRepo } from '../../core/repo-interfaces/IJobFormRepo'
import { JobStatus } from '../../core/entities/job.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { JobFormDTO, ReadJobFormDTO, toReadJobFormDTO } from '../../core/dtos/job-form.dto'
import { NotFoundError, ForbiddenError } from '../errors'
import { Membership } from './types'

@injectable()
export class JobFormService {
  constructor(
    @inject(TOKENS.IJobRepo) private readonly jobRepo: IJobRepo,
    @inject(TOKENS.IJobFormRepo) private readonly formRepo: IJobFormRepo,
  ) {}

  async get(jobId: string, membership: Membership): Promise<ReadJobFormDTO | null> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    const form = await this.formRepo.findByJob(jobId)
    return form ? toReadJobFormDTO(form) : null
  }

  async save(jobId: string, dto: JobFormDTO, membership: Membership): Promise<ReadJobFormDTO> {
    const job = await this.jobRepo.findById(jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()
    if (membership.role === OrgRole.RECRUITER && job.recruiterId !== membership.userId) {
      throw new ForbiddenError('Recruiters can only edit forms for their own jobs')
    }

    const form = await this.formRepo.save({ jobId, sections: dto.sections, fields: dto.fields })

    // Form structure is part of public-facing content; changing it on a published job sends it back to draft.
    if (job.status === JobStatus.PUBLISHED) {
      await this.jobRepo.update(jobId, { status: JobStatus.DRAFT })
    }
    return toReadJobFormDTO(form)
  }
}
