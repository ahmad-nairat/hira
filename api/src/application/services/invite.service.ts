import { injectable, inject } from 'tsyringe'
import crypto from 'crypto'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IInviteRepo } from '../../core/repo-interfaces/IInviteRepo'
import { IOrgRepo } from '../../core/repo-interfaces/IOrgRepo'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { CreateInviteDTO, ReadInviteDTO, toReadInviteDTO } from '../../core/dtos/invite.dto'
import { InviteStatus } from '../../core/entities/invite.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotFoundError, ForbiddenError, BusinessRuleError, ConflictError } from '../errors'
import { Membership } from './types'
import { IMailService } from '../../infrastructure/services/mail.service'

const INVITE_EXPIRY_DAYS = 7

@injectable()
export class InviteService {
  constructor(
    @inject(TOKENS.IInviteRepo) private readonly inviteRepo: IInviteRepo,
    @inject(TOKENS.IOrgRepo) private readonly orgRepo: IOrgRepo,
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
    @inject(TOKENS.IOrgMembershipRepo) private readonly membershipRepo: IOrgMembershipRepo,
    @inject(TOKENS.IMailService) private readonly mail: IMailService,
  ) {}

  async list(orgId: string, membership: Membership): Promise<ReadInviteDTO[]> {
    this.assertAdmin(orgId, membership)
    const invites = await this.inviteRepo.findByOrg(orgId)
    return invites.map(toReadInviteDTO)
  }

  async create(orgId: string, dto: CreateInviteDTO, membership: Membership): Promise<ReadInviteDTO> {
    this.assertAdmin(orgId, membership)
    const email = dto.email.toLowerCase()

    const existing = await this.inviteRepo.findActiveByEmailAndOrg(email, orgId)
    if (existing) throw new ConflictError('An invite already exists for this email')

    const user = await this.userRepo.findByEmail(email)
    if (user) {
      const userMembership = await this.membershipRepo.findByUser(user.id)
      if (userMembership) throw new BusinessRuleError('That user already belongs to an organisation')
    }

    const token = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    const invite = await this.inviteRepo.create({
      orgId,
      email,
      role: dto.role,
      token,
      invitedBy: membership.userId,
      expiresAt,
    })
    const org = await this.orgRepo.findById(orgId)
    if (org) await this.mail.sendInviteEmail(email, token, org.name)
    return toReadInviteDTO(invite)
  }

  async revoke(orgId: string, inviteId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    const invite = await this.inviteRepo.findById(inviteId)
    if (!invite || invite.orgId !== orgId) throw new NotFoundError('Invite')
    await this.inviteRepo.updateStatus(inviteId, InviteStatus.REVOKED)
  }

  async resend(orgId: string, inviteId: string, membership: Membership): Promise<ReadInviteDTO> {
    this.assertAdmin(orgId, membership)
    const invite = await this.inviteRepo.findById(inviteId)
    if (!invite || invite.orgId !== orgId) throw new NotFoundError('Invite')
    if (invite.status !== InviteStatus.PENDING) throw new BusinessRuleError('Only pending invites can be resent')

    const token = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    const updated = await this.inviteRepo.updateToken(inviteId, token, expiresAt)
    const org = await this.orgRepo.findById(orgId)
    if (org) await this.mail.sendInviteEmail(invite.email, token, org.name)
    return toReadInviteDTO(updated)
  }

  async getByToken(token: string): Promise<ReadInviteDTO> {
    const invite = await this.inviteRepo.findByToken(token)
    if (!invite) throw new NotFoundError('Invite')
    if (invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
      throw new BusinessRuleError('Invite is no longer valid')
    }
    return toReadInviteDTO(invite)
  }

  async accept(token: string, userId: string): Promise<{ orgId: string }> {
    const invite = await this.inviteRepo.findByToken(token)
    if (!invite) throw new NotFoundError('Invite')
    if (invite.status !== InviteStatus.PENDING || invite.expiresAt < new Date()) {
      throw new BusinessRuleError('Invite is no longer valid')
    }
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenError('Invite is for a different email')
    }

    const existing = await this.membershipRepo.findByUser(userId)
    if (existing) throw new BusinessRuleError('You already belong to an organisation')

    await this.membershipRepo.create({ userId, orgId: invite.orgId, role: invite.role })
    await this.inviteRepo.updateStatus(invite.id, InviteStatus.ACCEPTED)
    return { orgId: invite.orgId }
  }

  async decline(token: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findByToken(token)
    if (!invite) throw new NotFoundError('Invite')
    const user = await this.userRepo.findById(userId)
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenError('Invite is for a different email')
    }
    await this.inviteRepo.updateStatus(invite.id, InviteStatus.REVOKED)
  }

  private assertAdmin(orgId: string, membership: Membership): void {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    if (membership.role !== OrgRole.ADMIN) throw new ForbiddenError('Admin role required')
  }
}
