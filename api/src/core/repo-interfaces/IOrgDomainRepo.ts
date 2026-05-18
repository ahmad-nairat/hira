import { OrgDomain, DomainStatus } from '../entities/org-domain.entity'

export interface CreateOrgDomainInput {
  orgId: string
  domain: string
  verificationToken: string
  submittedAt: Date
}

export interface IOrgDomainRepo {
  findById(id: string): Promise<OrgDomain | null>
  findByOrg(orgId: string): Promise<OrgDomain | null>
  findVerifiedByDomain(domain: string): Promise<OrgDomain | null>
  deleteByOrg(orgId: string): Promise<void>
  create(data: CreateOrgDomainInput): Promise<OrgDomain>
  updateStatus(id: string, status: DomainStatus, verifiedAt?: Date | null): Promise<OrgDomain>
}
