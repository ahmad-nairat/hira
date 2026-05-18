import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { ReadMemberDTO, toReadMemberDTO, UpdateMemberRoleDTO } from '../../core/dtos/member.dto'
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../errors'
import { Membership } from './types'

@injectable()
export class MemberService {
  constructor(
    @inject(TOKENS.IOrgMembershipRepo) private readonly membershipRepo: IOrgMembershipRepo,
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
  ) {}

  async listMembers(orgId: string, membership: Membership): Promise<ReadMemberDTO[]> {
    this.assertAdmin(orgId, membership)
    const members = await this.membershipRepo.findByOrg(orgId)
    return members.map(toReadMemberDTO)
  }

  async updateRole(orgId: string, userId: string, dto: UpdateMemberRoleDTO, membership: Membership): Promise<ReadMemberDTO> {
    this.assertAdmin(orgId, membership)
    const target = await this.membershipRepo.findByUserAndOrg(userId, orgId)
    if (!target) throw new NotFoundError('Member')

    if (target.role === OrgRole.ADMIN && dto.role !== OrgRole.ADMIN) {
      const adminCount = await this.membershipRepo.countAdmins(orgId)
      if (adminCount <= 1) {
        throw new BusinessRuleError('Cannot demote the last admin. Transfer ownership first.')
      }
    }

    const updated = await this.membershipRepo.updateRole(target.id, dto.role)
    return toReadMemberDTO(updated)
  }

  async removeMember(orgId: string, userId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    const target = await this.membershipRepo.findByUserAndOrg(userId, orgId)
    if (!target) throw new NotFoundError('Member')

    if (target.userId === membership.userId) {
      throw new BusinessRuleError('You cannot remove yourself. Transfer ownership first.')
    }
    if (target.role === OrgRole.ADMIN) {
      const adminCount = await this.membershipRepo.countAdmins(orgId)
      if (adminCount <= 1) throw new BusinessRuleError('Cannot remove the last admin')
    }
    await this.membershipRepo.delete(target.id)
  }

  private assertAdmin(orgId: string, membership: Membership): void {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    if (membership.role !== OrgRole.ADMIN) throw new ForbiddenError('Admin role required')
  }
}
