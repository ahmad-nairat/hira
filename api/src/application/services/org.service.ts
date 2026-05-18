import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOrgRepo } from '../../core/repo-interfaces/IOrgRepo'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { IOrgDomainRepo } from '../../core/repo-interfaces/IOrgDomainRepo'
import { IInviteRepo } from '../../core/repo-interfaces/IInviteRepo'
import {
  CreateOrgDTO,
  UpdateOrgDTO,
  UpdateBrandingDTO,
  UpdateScoringDTO,
  UpdateAutoJoinDTO,
  ReadOrgDTO,
  toReadOrgDTO,
} from '../../core/dtos/org.dto'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { DomainStatus } from '../../core/entities/org-domain.entity'
import { ConflictError, NotFoundError, ForbiddenError, BusinessRuleError } from '../errors'
import { Membership } from './types'

@injectable()
export class OrgService {
  constructor(
    @inject(TOKENS.IOrgRepo) private readonly orgRepo: IOrgRepo,
    @inject(TOKENS.IOrgMembershipRepo) private readonly membershipRepo: IOrgMembershipRepo,
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
    @inject(TOKENS.IOrgDomainRepo) private readonly domainRepo: IOrgDomainRepo,
    @inject(TOKENS.IInviteRepo) private readonly inviteRepo: IInviteRepo,
  ) {}

  async create(dto: CreateOrgDTO, userId: string): Promise<ReadOrgDTO> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')

    const existingMembership = await this.membershipRepo.findByUser(userId)
    if (existingMembership) throw new BusinessRuleError('You already belong to an organisation')

    const emailDomain = user.email.split('@')[1]?.toLowerCase()
    if (emailDomain) {
      const verifiedOwner = await this.domainRepo.findVerifiedByDomain(emailDomain)
      if (verifiedOwner) {
        throw new BusinessRuleError(
          'Your email domain belongs to an existing organisation. Request access instead.',
        )
      }
    }

    const slugTaken = await this.orgRepo.findBySlug(dto.slug)
    if (slugTaken) throw new ConflictError('Slug already in use')

    const org = await this.orgRepo.create({ name: dto.name, slug: dto.slug })
    await this.membershipRepo.create({ userId, orgId: org.id, role: OrgRole.ADMIN })
    return toReadOrgDTO(org)
  }

  async findById(orgId: string, membership: Membership): Promise<ReadOrgDTO> {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new NotFoundError('Org')
    return toReadOrgDTO(org)
  }

  async update(orgId: string, dto: UpdateOrgDTO, membership: Membership): Promise<ReadOrgDTO> {
    this.assertAdmin(orgId, membership)
    const updated = await this.orgRepo.update(orgId, dto)
    return toReadOrgDTO(updated)
  }

  async updateBranding(orgId: string, dto: UpdateBrandingDTO, membership: Membership): Promise<ReadOrgDTO> {
    this.assertAdmin(orgId, membership)
    const updated = await this.orgRepo.update(orgId, dto)
    return toReadOrgDTO(updated)
  }

  async updateScoring(orgId: string, dto: UpdateScoringDTO, membership: Membership): Promise<ReadOrgDTO> {
    this.assertAdmin(orgId, membership)
    const updated = await this.orgRepo.update(orgId, dto)
    return toReadOrgDTO(updated)
  }

  async updateAutoJoin(orgId: string, dto: UpdateAutoJoinDTO, membership: Membership): Promise<ReadOrgDTO> {
    this.assertAdmin(orgId, membership)
    if (dto.autoJoinEnabled) {
      const domain = await this.domainRepo.findByOrg(orgId)
      if (!domain || domain.status !== DomainStatus.VERIFIED) {
        throw new BusinessRuleError('Auto-join requires a verified domain')
      }
      if (!dto.autoJoinDefaultRole) {
        throw new BusinessRuleError('A default role is required when enabling auto-join')
      }
    }
    const updated = await this.orgRepo.update(orgId, dto)
    return toReadOrgDTO(updated)
  }

  async delete(orgId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    const members = await this.membershipRepo.findByOrg(orgId)
    for (const m of members) await this.userRepo.softDelete(m.userId)
    await this.orgRepo.softDelete(orgId)
  }

  private assertAdmin(orgId: string, membership: Membership): void {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    if (membership.role !== OrgRole.ADMIN) throw new ForbiddenError('Admin role required')
  }
}
