import { injectable, inject } from 'tsyringe'
import crypto from 'crypto'
import * as dns from 'dns'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOrgDomainRepo } from '../../core/repo-interfaces/IOrgDomainRepo'
import { CreateDomainDTO, ReadOrgDomainDTO, toReadOrgDomainDTO } from '../../core/dtos/domain.dto'
import { DomainStatus } from '../../core/entities/org-domain.entity'
import { NotFoundError, ForbiddenError, BusinessRuleError } from '../errors'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { Membership } from './types'

@injectable()
export class DomainService {
  constructor(@inject(TOKENS.IOrgDomainRepo) private readonly domainRepo: IOrgDomainRepo) {}

  async findForOrg(orgId: string, membership: Membership): Promise<ReadOrgDomainDTO | null> {
    this.assertAdmin(orgId, membership)
    const d = await this.domainRepo.findByOrg(orgId)
    return d ? toReadOrgDomainDTO(d) : null
  }

  async create(orgId: string, dto: CreateDomainDTO, membership: Membership): Promise<ReadOrgDomainDTO> {
    this.assertAdmin(orgId, membership)
    const normalized = dto.domain.toLowerCase()

    const existingVerified = await this.domainRepo.findVerifiedByDomain(normalized)
    if (existingVerified && existingVerified.orgId !== orgId) {
      throw new BusinessRuleError('This domain is already verified by another organisation')
    }

    await this.domainRepo.deleteByOrg(orgId)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const record = await this.domainRepo.create({
      orgId,
      domain: normalized,
      verificationToken,
      submittedAt: new Date(),
    })

    const verified = await this.checkDns(normalized, verificationToken)
    if (verified) {
      const updated = await this.domainRepo.updateStatus(record.id, DomainStatus.VERIFIED, new Date())
      return toReadOrgDomainDTO(updated)
    }
    return toReadOrgDomainDTO(record)
  }

  async delete(orgId: string, membership: Membership): Promise<void> {
    this.assertAdmin(orgId, membership)
    await this.domainRepo.deleteByOrg(orgId)
  }

  async verify(orgId: string, membership: Membership): Promise<ReadOrgDomainDTO> {
    this.assertAdmin(orgId, membership)
    const record = await this.domainRepo.findByOrg(orgId)
    if (!record) throw new NotFoundError('Domain')

    if (record.status === DomainStatus.VERIFIED) return toReadOrgDomainDTO(record)
    const verified = await this.checkDns(record.domain, record.verificationToken)
    if (!verified) return toReadOrgDomainDTO(record)
    const updated = await this.domainRepo.updateStatus(record.id, DomainStatus.VERIFIED, new Date())
    return toReadOrgDomainDTO(updated)
  }

  private async checkDns(domain: string, token: string): Promise<boolean> {
    try {
      const records = await dns.promises.resolveTxt(`_hira-verify.${domain}`)
      return records.flat().includes(`hira-verify=${token}`)
    } catch {
      return false
    }
  }

  private assertAdmin(orgId: string, membership: Membership): void {
    if (membership.orgId !== orgId) throw new ForbiddenError()
    if (membership.role !== OrgRole.ADMIN) throw new ForbiddenError('Admin role required')
  }
}
