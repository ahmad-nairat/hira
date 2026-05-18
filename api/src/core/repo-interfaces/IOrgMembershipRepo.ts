import { OrgMembership, OrgRole } from '../entities/org-membership.entity'

export interface CreateOrgMembershipInput {
  userId: string
  orgId: string
  role: OrgRole
}

export interface IOrgMembershipRepo {
  findById(id: string): Promise<OrgMembership | null>
  findByUserAndOrg(userId: string, orgId: string): Promise<OrgMembership | null>
  findByUser(userId: string): Promise<OrgMembership | null>
  findByOrg(orgId: string): Promise<OrgMembership[]>
  create(data: CreateOrgMembershipInput): Promise<OrgMembership>
  updateRole(id: string, role: OrgRole): Promise<OrgMembership>
  delete(id: string): Promise<void>
  countAdmins(orgId: string): Promise<number>
}
