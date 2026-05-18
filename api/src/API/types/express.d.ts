import { OrgRole } from '../../core/entities/org-membership.entity'

declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      fullName?: string
      avatarUrl?: string
    }

    interface Request {
      membership?: { userId: string; orgId: string; role: OrgRole }
      validated?: { query?: unknown; params?: unknown }
    }
  }
}

export {}
