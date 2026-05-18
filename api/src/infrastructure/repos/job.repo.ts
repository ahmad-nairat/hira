import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Job, JobStatus } from '../../core/entities/job.entity'
import { IJobRepo, CreateJobInput } from '../../core/repo-interfaces/IJobRepo'
import { JobQueryDTO } from '../../core/dtos/job.dto'

@injectable()
export class JobRepo implements IJobRepo {
  private get repo(): Repository<Job> {
    return AppDataSource.getRepository(Job)
  }

  async findById(id: string): Promise<Job | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['recruiter', 'hiringManager'],
    })
  }

  async findAll(query: JobQueryDTO, orgId: string): Promise<[Job[], number]> {
    const qb = this.repo
      .createQueryBuilder('j')
      .where('j.orgId = :orgId AND j.deletedAt IS NULL', { orgId })

    if (query.status) qb.andWhere('j.status = :status', { status: query.status })
    if (query.type) qb.andWhere('j.type = :type', { type: query.type })
    if (query.search) qb.andWhere('j.title ILIKE :s', { s: `%${query.search}%` })

    return qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .orderBy('j.createdAt', 'DESC')
      .getManyAndCount()
  }

  async findPublishedByOrg(orgId: string): Promise<Job[]> {
    return this.repo.find({
      where: { orgId, status: JobStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    })
  }

  async create(data: CreateJobInput): Promise<Job> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Job>): Promise<Job> {
    await this.repo.update({ id }, patch)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Job not found after update')
    return updated
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
