import { OrgRole } from '../../core/entities/org-membership.entity'

export interface Membership {
  userId: string
  orgId: string
  role: OrgRole
}

export interface AuthUser {
  id: string
  email: string
}
