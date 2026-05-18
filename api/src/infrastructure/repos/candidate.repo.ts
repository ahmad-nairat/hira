import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Candidate } from '../../core/entities/candidate.entity'
import { ICandidateRepo, CreateCandidateInput } from '../../core/repo-interfaces/ICandidateRepo'
import { CandidateQueryDTO } from '../../core/dtos/candidate.dto'

@injectable()
export class CandidateRepo implements ICandidateRepo {
  private get repo(): Repository<Candidate> {
    return AppDataSource.getRepository(Candidate)
  }

  async findById(id: string): Promise<Candidate | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } })
  }

  async findByOrgAndEmail(orgId: string, email: string): Promise<Candidate | null> {
    return this.repo.findOne({ where: { orgId, email: email.toLowerCase(), deletedAt: IsNull() } })
  }

  async findByOrgAndPhone(orgId: string, phone: string): Promise<Candidate | null> {
    return this.repo.findOne({ where: { orgId, phone, deletedAt: IsNull() } })
  }

  async findAll(query: CandidateQueryDTO, orgId: string): Promise<[Candidate[], number]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.orgId = :orgId AND c.deletedAt IS NULL', { orgId })

    if (query.search) qb.andWhere('(c.fullName ILIKE :s OR c.email ILIKE :s)', { s: `%${query.search}%` })
    if (query.isHired !== undefined) qb.andWhere('c.isHired = :isHired', { isHired: query.isHired })

    return qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .orderBy('c.createdAt', 'DESC')
      .getManyAndCount()
  }

  async create(data: CreateCandidateInput): Promise<Candidate> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Candidate>): Promise<Candidate> {
    await this.repo.update({ id }, patch)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Candidate not found after update')
    return updated
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
