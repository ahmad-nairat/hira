import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { ICandidateRepo } from '../../core/repo-interfaces/ICandidateRepo'
import { IBlacklistRepo } from '../../core/repo-interfaces/IBlacklistRepo'
import { IJobRepo } from '../../core/repo-interfaces/IJobRepo'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import {
  CreateCandidateDTO,
  UpdateCandidateDTO,
  BlacklistDTO,
  SuggestDTO,
  CandidateQueryDTO,
  ReadCandidateDTO,
  toReadCandidateDTO,
} from '../../core/dtos/candidate.dto'
import { CandidateSource } from '../../core/entities/candidate.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../errors'
import { Membership } from './types'
import { IMailService } from '../../infrastructure/services/mail.service'

@injectable()
export class CandidateService {
  constructor(
    @inject(TOKENS.ICandidateRepo) private readonly candidateRepo: ICandidateRepo,
    @inject(TOKENS.IBlacklistRepo) private readonly blacklistRepo: IBlacklistRepo,
    @inject(TOKENS.IJobRepo) private readonly jobRepo: IJobRepo,
    @inject(TOKENS.IApplicationRepo) private readonly applicationRepo: IApplicationRepo,
    @inject(TOKENS.IMailService) private readonly mail: IMailService,
  ) {}

  async findAll(query: CandidateQueryDTO, membership: Membership) {
    const [items, total] = await this.candidateRepo.findAll(query, membership.orgId)
    return { data: items.map(toReadCandidateDTO), total, page: query.page, limit: query.limit }
  }

  async findById(candidateId: string, membership: Membership): Promise<ReadCandidateDTO> {
    const c = await this.candidateRepo.findById(candidateId)
    if (!c) throw new NotFoundError('Candidate')
    if (c.orgId !== membership.orgId) throw new ForbiddenError()
    // findByCandidate already orders DESC by createdAt; the first row is the latest.
    const apps = await this.applicationRepo.findByCandidate(candidateId)
    const latestResumeUrl = apps[0]?.resumeUrl ?? null
    return toReadCandidateDTO(c, latestResumeUrl)
  }

  async create(dto: CreateCandidateDTO, membership: Membership): Promise<ReadCandidateDTO> {
    this.assertCanManage(membership)
    const existing = await this.candidateRepo.findByOrgAndEmail(membership.orgId, dto.email.toLowerCase())
    if (existing) throw new BusinessRuleError('A candidate with this email already exists')
    const candidate = await this.candidateRepo.create({
      orgId: membership.orgId,
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      source: dto.source ?? CandidateSource.MANUAL_UPLOAD,
    })
    return toReadCandidateDTO(candidate)
  }

  async update(candidateId: string, dto: UpdateCandidateDTO, membership: Membership): Promise<ReadCandidateDTO> {
    this.assertCanManage(membership)
    const c = await this.candidateRepo.findById(candidateId)
    if (!c) throw new NotFoundError('Candidate')
    if (c.orgId !== membership.orgId) throw new ForbiddenError()
    const updated = await this.candidateRepo.update(candidateId, dto)
    return toReadCandidateDTO(updated)
  }

  async blacklist(candidateId: string, dto: BlacklistDTO, membership: Membership): Promise<void> {
    this.assertCanManage(membership)
    const c = await this.candidateRepo.findById(candidateId)
    if (!c) throw new NotFoundError('Candidate')
    if (c.orgId !== membership.orgId) throw new ForbiddenError()

    const expiresAt = this.resolveExpiry(dto)
    await this.blacklistRepo.create({
      orgId: membership.orgId,
      candidateId,
      reason: dto.reason,
      blacklistedBy: membership.userId,
      durationType: dto.durationType,
      expiresAt,
    })
  }

  async unblacklist(candidateId: string, membership: Membership): Promise<void> {
    this.assertCanManage(membership)
    const c = await this.candidateRepo.findById(candidateId)
    if (!c) throw new NotFoundError('Candidate')
    if (c.orgId !== membership.orgId) throw new ForbiddenError()
    await this.blacklistRepo.deleteByOrgAndCandidate(membership.orgId, candidateId)
  }

  async suggest(candidateId: string, dto: SuggestDTO, membership: Membership): Promise<void> {
    const c = await this.candidateRepo.findById(candidateId)
    if (!c) throw new NotFoundError('Candidate')
    if (c.orgId !== membership.orgId) throw new ForbiddenError()
    const job = await this.jobRepo.findById(dto.jobId)
    if (!job) throw new NotFoundError('Job')
    if (job.orgId !== membership.orgId) throw new ForbiddenError()

    const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
    const applyUrl = `${appUrl.replace(/\/app$/, '')}/careers/${job.orgId}/${job.id}`
    await this.mail.sendSuggestEmail(c.email, job.title, applyUrl, 'Hira')
  }

  private resolveExpiry(dto: BlacklistDTO): Date | null {
    if (dto.durationType === 'permanent') return null
    if (dto.durationType === 'months_6') return new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
    if (dto.durationType === 'months_12') return new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000)
    if (dto.durationType === 'custom' && dto.expiresAt) return new Date(dto.expiresAt)
    throw new BusinessRuleError('Invalid blacklist duration')
  }

  private assertCanManage(membership: Membership): void {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER) {
      throw new ForbiddenError('Only admins or recruiters can manage candidates')
    }
  }
}
