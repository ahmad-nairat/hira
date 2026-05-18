import { z } from 'zod'
import { Invite, InviteStatus } from '../entities/invite.entity'
import { OrgRole } from '../entities/org-membership.entity'

export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrgRole),
})

export type CreateInviteDTO = z.infer<typeof CreateInviteSchema>

export interface ReadInviteDTO {
  id: string
  orgId: string
  email: string
  role: OrgRole
  status: InviteStatus
  expiresAt: string
  createdAt: string
  orgName?: string
}

export function toReadInviteDTO(i: Invite): ReadInviteDTO {
  return {
    id: i.id,
    orgId: i.orgId,
    email: i.email,
    role: i.role,
    status: i.status,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
    orgName: i.org?.name,
  }
}
