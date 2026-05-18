import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Org } from '../../core/entities/org.entity'
import { IOrgRepo, CreateOrgInput } from '../../core/repo-interfaces/IOrgRepo'

@injectable()
export class OrgRepo implements IOrgRepo {
  private get repo(): Repository<Org> {
    return AppDataSource.getRepository(Org)
  }

  async findById(id: string): Promise<Org | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } })
  }

  async findBySlug(slug: string): Promise<Org | null> {
    return this.repo.findOne({ where: { slug, deletedAt: IsNull() } })
  }

  async create(data: CreateOrgInput): Promise<Org> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Org>): Promise<Org> {
    await this.repo.update({ id }, patch)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Org not found after update')
    return updated
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
