import { Invite, InviteStatus } from '../entities/invite.entity'
import { OrgRole } from '../entities/org-membership.entity'

export interface CreateInviteInput {
  orgId: string
  email: string
  role: OrgRole
  token: string
  invitedBy: string
  expiresAt: Date
}

export interface IInviteRepo {
  findById(id: string): Promise<Invite | null>
  findByToken(token: string): Promise<Invite | null>
  findByOrg(orgId: string): Promise<Invite[]>
  findActiveByEmailAndOrg(email: string, orgId: string): Promise<Invite | null>
  findActiveByEmail(email: string): Promise<Invite[]>
  create(data: CreateInviteInput): Promise<Invite>
  updateStatus(id: string, status: InviteStatus): Promise<Invite>
  updateToken(id: string, token: string, expiresAt: Date): Promise<Invite>
  delete(id: string): Promise<void>
}
