import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOrgRepo } from '../../core/repo-interfaces/IOrgRepo'
import { IJobRepo } from '../../core/repo-interfaces/IJobRepo'
import { IJobFormRepo } from '../../core/repo-interfaces/IJobFormRepo'
import { JobStatus } from '../../core/entities/job.entity'
import { FieldType } from '../../core/entities/job-form-field.entity'
import {
  PublicCareersPageDTO,
  PublicJobFullDetailDTO,
  PublicJobSummaryDTO,
  PublicOrgBrandingDTO,
} from '../../core/dtos/public.dto'
import { toReadJobFormDTO, ReadJobFormDTO } from '../../core/dtos/job-form.dto'
import { Job } from '../../core/entities/job.entity'
import { Org } from '../../core/entities/org.entity'
import { JobFormField } from '../../core/entities/job-form-field.entity'
import { NotFoundError, BusinessRuleError } from '../errors'
import { ApplicationService } from './application.service'

@injectable()
export class PublicService {
  constructor(
    @inject(TOKENS.IOrgRepo) private readonly orgRepo: IOrgRepo,
    @inject(TOKENS.IJobRepo) private readonly jobRepo: IJobRepo,
    @inject(TOKENS.IJobFormRepo) private readonly jobFormRepo: IJobFormRepo,
    @inject(ApplicationService) private readonly applicationService: ApplicationService,
  ) {}

  async getCareersPage(orgSlug: string): Promise<PublicCareersPageDTO> {
    const org = await this.orgRepo.findBySlug(orgSlug)
    if (!org) throw new NotFoundError('Organisation')
    const jobs = await this.jobRepo.findPublishedByOrg(org.id)
    return { org: this.toBranding(org), jobs: jobs.map((j) => this.toJobSummary(j)) }
  }

  async getJob(orgSlug: string, jobId: string): Promise<PublicJobFullDetailDTO> {
    const org = await this.orgRepo.findBySlug(orgSlug)
    if (!org) throw new NotFoundError('Organisation')
    const job = await this.jobRepo.findById(jobId)
    if (!job || job.orgId !== org.id || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundError('Job')
    }
    const form = await this.jobFormRepo.findByJob(jobId)
    return {
      ...this.toJobSummary(job),
      description: job.description,
      org: this.toBranding(org),
      form: {
        sections: (form?.sections ?? []).map((s) => ({ id: s.id, title: s.title, sortOrder: s.sortOrder })),
        fields: (form?.fields ?? []).map((f) => ({
          id: f.id,
          sectionId: f.sectionId,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          isRequired: f.isRequired,
          isResume: f.isResume,
          sortOrder: f.sortOrder,
          options: f.options,
          validation: f.validation,
        })),
      },
    }
  }

  async getJobForm(orgSlug: string, jobId: string): Promise<ReadJobFormDTO> {
    const org = await this.orgRepo.findBySlug(orgSlug)
    if (!org) throw new NotFoundError('Organisation')
    const job = await this.jobRepo.findById(jobId)
    if (!job || job.orgId !== org.id || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundError('Job')
    }
    const form = await this.jobFormRepo.findByJob(jobId)
    if (!form) throw new NotFoundError('Form')
    return toReadJobFormDTO(form)
  }

  async apply(
    orgSlug: string,
    jobId: string,
    rawAnswers: Record<string, unknown>,
    resumeBuffer: Buffer,
    resumeExt: string,
  ): Promise<void> {
    const org = await this.orgRepo.findBySlug(orgSlug)
    if (!org) throw new NotFoundError('Organisation')
    const job = await this.jobRepo.findById(jobId)
    if (!job || job.orgId !== org.id || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundError('Job')
    }

    const form = await this.jobFormRepo.findByJob(jobId)
    if (!form) throw new NotFoundError('Form')

    this.validateAnswers(form.fields, rawAnswers)

    const emailField = form.fields.find((f) => f.type === FieldType.TEXT && f.label.toLowerCase().includes('email'))
    const nameField = form.fields.find((f) => f.type === FieldType.TEXT && f.label.toLowerCase().includes('name'))
    const phoneField = form.fields.find((f) => f.type === FieldType.TEXT && f.label.toLowerCase().includes('phone'))
    if (!emailField) throw new BusinessRuleError('Form must include an email field')
    if (!nameField) throw new BusinessRuleError('Form must include a full name field')

    const email = String(rawAnswers[emailField.id] ?? '').trim()
    const fullName = String(rawAnswers[nameField.id] ?? '').trim()
    const phone = phoneField ? String(rawAnswers[phoneField.id] ?? '').trim() || null : null
    if (!email || !fullName) throw new BusinessRuleError('Email and full name are required')

    await this.applicationService.ingestPublicApplication({
      orgId: org.id,
      jobId,
      formAnswers: rawAnswers,
      candidate: { email, fullName, phone },
      resumeBuffer,
      resumeExt,
    })
  }

  private toJobSummary(j: Job): PublicJobSummaryDTO {
    return {
      id: j.id,
      title: j.title,
      location: j.location,
      type: j.type,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      salaryCurrency: j.salaryCurrency,
      publishedAt: j.publishedAt?.toISOString() ?? j.createdAt.toISOString(),
    }
  }

  private toBranding(org: Org): PublicOrgBrandingDTO {
    return {
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      secondaryColor: org.secondaryColor,
      careersLogoUrl: org.careersLogoUrl,
      careersHeroHeadline: org.careersHeroHeadline,
      careersHeroSubheadline: org.careersHeroSubheadline,
      careersHeroBgType: org.careersHeroBgType,
      careersHeroBgValue: org.careersHeroBgValue,
      careersCtaLabel: org.careersCtaLabel,
    }
  }

  private validateAnswers(fields: JobFormField[], answers: Record<string, unknown>): void {
    for (const f of fields) {
      const value = answers[f.id]
      const provided = value !== undefined && value !== null && value !== ''
      if (f.isRequired && !provided && !f.isResume) {
        throw new BusinessRuleError(`Field "${f.label}" is required`)
      }
      if (!provided) continue

      if (f.type === FieldType.NUMBER) {
        const n = Number(value)
        if (Number.isNaN(n)) throw new BusinessRuleError(`Field "${f.label}" must be a number`)
        if (f.validation?.min !== undefined && n < f.validation.min) {
          throw new BusinessRuleError(`Field "${f.label}" is below minimum ${f.validation.min}`)
        }
        if (f.validation?.max !== undefined && n > f.validation.max) {
          throw new BusinessRuleError(`Field "${f.label}" is above maximum ${f.validation.max}`)
        }
      }

      if (f.type === FieldType.TEXT || f.type === FieldType.TEXTAREA) {
        const s = String(value)
        if (f.validation?.minLength !== undefined && s.length < f.validation.minLength) {
          throw new BusinessRuleError(`Field "${f.label}" is too short`)
        }
        if (f.validation?.maxLength !== undefined && s.length > f.validation.maxLength) {
          throw new BusinessRuleError(`Field "${f.label}" is too long`)
        }
      }
    }
  }
}
