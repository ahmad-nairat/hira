import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { AccessRequest, AccessRequestStatus } from '../../core/entities/access-request.entity'
import { IAccessRequestRepo, CreateAccessRequestInput } from '../../core/repo-interfaces/IAccessRequestRepo'

@injectable()
export class AccessRequestRepo implements IAccessRequestRepo {
  private get repo(): Repository<AccessRequest> {
    return AppDataSource.getRepository(AccessRequest)
  }

  async findById(id: string): Promise<AccessRequest | null> {
    return this.repo.findOne({ where: { id }, relations: ['user'] })
  }

  async findByOrg(orgId: string, status?: AccessRequestStatus): Promise<AccessRequest[]> {
    const where = status ? { orgId, status } : { orgId }
    return this.repo.find({ where, relations: ['user'], order: { createdAt: 'DESC' } })
  }

  async findByUserAndOrg(userId: string, orgId: string): Promise<AccessRequest | null> {
    return this.repo.findOne({ where: { userId, orgId } })
  }

  async create(data: CreateAccessRequestInput): Promise<AccessRequest> {
    return this.repo.save(this.repo.create(data))
  }

  async updateStatus(id: string, status: AccessRequestStatus, reviewedBy: string): Promise<AccessRequest> {
    await this.repo.update({ id }, { status, reviewedBy })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Request not found after update')
    return updated
  }
}
