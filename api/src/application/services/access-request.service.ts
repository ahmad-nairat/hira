import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IAccessRequestRepo } from '../../core/repo-interfaces/IAccessRequestRepo'
import { IOrgRepo } from '../../core/repo-interfaces/IOrgRepo'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { IOrgDomainRepo } from '../../core/repo-interfaces/IOrgDomainRepo'
import { AccessRequestStatus } from '../../core/entities/access-request.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { DomainStatus } from '../../core/entities/org-domain.entity'
import { NotFoundError, ForbiddenError, BusinessRuleError, ConflictError } from '../errors'
import { Membership } from './types'
import { IMailService } from '../../infrastructure/services/mail.service'

@injectable()
export class AccessRequestService {
  constructor(
    @inject(TOKENS.IAccessRequestRepo) private readonly requestRepo: IAccessRequestRepo,
    @inject(TOKENS.IOrgRepo) private readonly orgRepo: IOrgRepo,
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
    @inject(TOKENS.IOrgMembershipRepo) private readonly membershipRepo: IOrgMembershipRepo,
    @inject(TOKENS.IOrgDomainRepo) private readonly domainRepo: IOrgDomainRepo,
    @inject(TOKENS.IMailService) private readonly mail: IMailService,
  ) {}

  async request(userId: string): Promise<{ orgId: string; autoJoined: boolean; role: OrgRole | null }> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')

    const existing = await this.membershipRepo.findByUser(userId)
    if (existing) throw new BusinessRuleError('You already belong to an organisation')

    const emailDomain = user.email.split('@')[1]?.toLowerCase()
    if (!emailDomain) throw new BusinessRuleError('Invalid email')
    const domain = await this.domainRepo.findVerifiedByDomain(emailDomain)
    if (!domain) throw new NotFoundError('No organisation owns this email domain')
    const org = await this.orgRepo.findById(domain.orgId)
    if (!org) throw new NotFoundError('Organisation')
    if (domain.status !== DomainStatus.VERIFIED) throw new NotFoundError('Organisation')

    if (org.autoJoinEnabled && org.autoJoinDefaultRole) {
      await this.membershipRepo.create({
        userId,
        orgId: org.id,
        role: org.autoJoinDefaultRole,
      })
      return { orgId: org.id, autoJoined: true, role: org.autoJoinDefaultRole }
    }

    const dup = await this.requestRepo.findByUserAndOrg(userId, org.id)
    if (dup && dup.status === AccessRequestStatus.PENDING) {
      throw new ConflictError('You already have a pending request')
    }
    await this.requestRepo.create({ userId, orgId: org.id })

    const admins = (await this.membershipRepo.findByOrg(org.id)).filter((m) => m.role === OrgRole.ADMIN)
    await Promise.all(
      admins.map((m) =>
        m.user ? this.mail.sendAccessRequestNotification(m.user.email, user.fullName, org.name) : Promise.resolve(),
      ),
    )
    return { orgId: org.id, autoJoined: false, role: null }
  }

  async list(orgId: string, membership: Membership) {
    this.assertAdmin(orgId, membership)
    return this.requestRepo.findByOrg(orgId, AccessRequestStatus.PENDING)
  }

  async approve(orgId: string, requestId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    const req = await this.requestRepo.findById(requestId)
    if (!req || req.orgId !== orgId) throw new NotFoundError('Request')
    if (req.status !== AccessRequestStatus.PENDING) throw new BusinessRuleError('Request already reviewed')

    const existing = await this.membershipRepo.findByUser(req.userId)
    if (existing) throw new BusinessRuleError('User already belongs to an organisation')

    const org = await this.orgRepo.findById(orgId)
    const role = org?.autoJoinDefaultRole ?? OrgRole.RECRUITER
    await this.membershipRepo.create({ userId: req.userId, orgId, role })
    await this.requestRepo.updateStatus(requestId, AccessRequestStatus.APPROVED, membership.userId)
  }

  async reject(orgId: string, requestId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    const req = await this.requestRepo.findById(requestId)
    if (!req || req.orgId !== orgId) throw new NotFoundError('Request')
    if (req.status !== AccessRequestStatus.PENDING) throw new BusinessRuleError('Request already reviewed')
    await this.requestRepo.updateStatus(requestId, AccessRequestStatus.REJECTED, membership.userId)
  }

  private assertAdmin(orgId: string, membership: Membership): void {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    if (membership.role !== OrgRole.ADMIN) throw new ForbiddenError('Admin role required')
  }
}
