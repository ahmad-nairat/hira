import { z } from 'zod'
import { OrgDomain, DomainStatus } from '../entities/org-domain.entity'

export const CreateDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain'),
})

export type CreateDomainDTO = z.infer<typeof CreateDomainSchema>

export interface ReadOrgDomainDTO {
  id: string
  orgId: string
  domain: string
  verificationToken: string
  status: DomainStatus
  submittedAt: string
  verifiedAt: string | null
  expectedTxtRecord: string
  expectedTxtHost: string
}

export function toReadOrgDomainDTO(d: OrgDomain): ReadOrgDomainDTO {
  return {
    id: d.id,
    orgId: d.orgId,
    domain: d.domain,
    verificationToken: d.verificationToken,
    status: d.status,
    submittedAt: d.submittedAt.toISOString(),
    verifiedAt: d.verifiedAt?.toISOString() ?? null,
    expectedTxtHost: `_hira-verify.${d.domain}`,
    expectedTxtRecord: `hira-verify=${d.verificationToken}`,
  }
}
