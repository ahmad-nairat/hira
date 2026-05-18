import { z } from 'zod'
import { OrgMembership, OrgRole } from '../entities/org-membership.entity'

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrgRole),
})

export type UpdateMemberRoleDTO = z.infer<typeof UpdateMemberRoleSchema>

export interface ReadMemberDTO {
  id: string
  userId: string
  orgId: string
  role: OrgRole
  joinedAt: string
  user: {
    email: string
    fullName: string
    avatarUrl: string | null
  } | null
}

export function toReadMemberDTO(m: OrgMembership): ReadMemberDTO {
  return {
    id: m.id,
    userId: m.userId,
    orgId: m.orgId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: m.user
      ? {
          email: m.user.email,
          fullName: m.user.fullName,
          avatarUrl: m.user.avatarUrl,
        }
      : null,
  }
}
