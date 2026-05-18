import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { OrgMembership, OrgRole } from '../../core/entities/org-membership.entity'
import { IOrgMembershipRepo, CreateOrgMembershipInput } from '../../core/repo-interfaces/IOrgMembershipRepo'

@injectable()
export class OrgMembershipRepo implements IOrgMembershipRepo {
  private get repo(): Repository<OrgMembership> {
    return AppDataSource.getRepository(OrgMembership)
  }

  async findById(id: string): Promise<OrgMembership | null> {
    return this.repo.findOne({ where: { id }, relations: ['user', 'org'] })
  }

  async findByUserAndOrg(userId: string, orgId: string): Promise<OrgMembership | null> {
    return this.repo.findOne({ where: { userId, orgId }, relations: ['user', 'org'] })
  }

  async findByUser(userId: string): Promise<OrgMembership | null> {
    return this.repo.findOne({ where: { userId }, relations: ['org'] })
  }

  async findByOrg(orgId: string): Promise<OrgMembership[]> {
    return this.repo.find({ where: { orgId }, relations: ['user'], order: { joinedAt: 'ASC' } })
  }

  async create(data: CreateOrgMembershipInput): Promise<OrgMembership> {
    return this.repo.save(this.repo.create(data))
  }

  async updateRole(id: string, role: OrgRole): Promise<OrgMembership> {
    await this.repo.update({ id }, { role })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Membership not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id })
  }

  async countAdmins(orgId: string): Promise<number> {
    return this.repo.count({ where: { orgId, role: OrgRole.ADMIN } })
  }
}
