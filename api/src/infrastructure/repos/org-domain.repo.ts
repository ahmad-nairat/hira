import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { OrgDomain, DomainStatus } from '../../core/entities/org-domain.entity'
import { IOrgDomainRepo, CreateOrgDomainInput } from '../../core/repo-interfaces/IOrgDomainRepo'

@injectable()
export class OrgDomainRepo implements IOrgDomainRepo {
  private get repo(): Repository<OrgDomain> {
    return AppDataSource.getRepository(OrgDomain)
  }

  async findById(id: string): Promise<OrgDomain | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByOrg(orgId: string): Promise<OrgDomain | null> {
    return this.repo.findOne({ where: { orgId } })
  }

  async findVerifiedByDomain(domain: string): Promise<OrgDomain | null> {
    return this.repo.findOne({ where: { domain: domain.toLowerCase(), status: DomainStatus.VERIFIED } })
  }

  async deleteByOrg(orgId: string): Promise<void> {
    await this.repo.delete({ orgId })
  }

  async create(data: CreateOrgDomainInput): Promise<OrgDomain> {
    return this.repo.save(this.repo.create(data))
  }

  async updateStatus(id: string, status: DomainStatus, verifiedAt: Date | null = null): Promise<OrgDomain> {
    await this.repo.update({ id }, { status, verifiedAt })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Domain not found after update')
    return updated
  }
}
