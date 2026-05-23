import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { IInviteRepo } from '../../core/repo-interfaces/IInviteRepo'
import { IOrgDomainRepo } from '../../core/repo-interfaces/IOrgDomainRepo'
import { IOrgRepo } from '../../core/repo-interfaces/IOrgRepo'
import { DomainStatus } from '../../core/entities/org-domain.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotFoundError } from '../errors'

interface OnboardingStatus {
  hasOrg: boolean
  currentOrgId: string | null
  // Caller's role in the current org (only set when hasOrg is true). Lets the
  // client populate auth state without listing all members — that endpoint is
  // admin-only and would silently 403 for non-admins.
  currentRole: OrgRole | null
  pendingInvites: Array<{ id: string; token: string; orgId: string; orgName: string | undefined; role: OrgRole }>
  domainOrg: { id: string; name: string; autoJoinEnabled: boolean } | null
}

@injectable()
export class OnboardingService {
  constructor(
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
    @inject(TOKENS.IOrgMembershipRepo) private readonly membershipRepo: IOrgMembershipRepo,
    @inject(TOKENS.IInviteRepo) private readonly inviteRepo: IInviteRepo,
    @inject(TOKENS.IOrgDomainRepo) private readonly domainRepo: IOrgDomainRepo,
    @inject(TOKENS.IOrgRepo) private readonly orgRepo: IOrgRepo,
  ) {}

  async check(userId: string): Promise<OnboardingStatus> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')

    const membership = await this.membershipRepo.findByUser(userId)
    if (membership) {
      return {
        hasOrg: true,
        currentOrgId: membership.orgId,
        currentRole: membership.role,
        pendingInvites: [],
        domainOrg: null,
      }
    }

    const invites = await this.inviteRepo.findActiveByEmail(user.email.toLowerCase())
    const pending = invites.map((i) => ({ id: i.id, token: i.token, orgId: i.orgId, orgName: i.org?.name, role: i.role }))

    const emailDomain = user.email.split('@')[1]?.toLowerCase()
    let domainOrg: OnboardingStatus['domainOrg'] = null
    if (emailDomain) {
      const d = await this.domainRepo.findVerifiedByDomain(emailDomain)
      if (d && d.status === DomainStatus.VERIFIED) {
        const org = await this.orgRepo.findById(d.orgId)
        if (org) domainOrg = { id: org.id, name: org.name, autoJoinEnabled: org.autoJoinEnabled }
      }
    }

    return { hasOrg: false, currentOrgId: null, currentRole: null, pendingInvites: pending, domainOrg }
  }
}
