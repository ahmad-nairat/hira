import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AppDataSource } from '../database/data-source'
import { Application, PipelineStage } from '../../core/entities/application.entity'
import { IApplicationRepo, CreateApplicationInput, ApplicationQueryDTO } from '../../core/repo-interfaces/IApplicationRepo'

@injectable()
export class ApplicationRepo implements IApplicationRepo {
  private get repo(): Repository<Application> {
    return AppDataSource.getRepository(Application)
  }

  async findById(id: string): Promise<Application | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['job', 'candidate', 'org', 'interviews'],
    })
  }

  async findByJob(jobId: string, query: ApplicationQueryDTO): Promise<[Application[], number]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.candidate', 'candidate')
      .where('a.jobId = :jobId AND a.deletedAt IS NULL', { jobId })

    if (query.stage) qb.andWhere('a.currentStage = :stage', { stage: query.stage })
    if (query.search) qb.andWhere('(candidate.fullName ILIKE :s OR candidate.email ILIKE :s)', { s: `%${query.search}%` })

    return qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .orderBy('a.createdAt', 'DESC')
      .getManyAndCount()
  }

  async findByCandidate(candidateId: string): Promise<Application[]> {
    return this.repo.find({
      where: { candidateId, deletedAt: IsNull() },
      relations: ['job'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByJobAndCandidate(jobId: string, candidateId: string): Promise<Application | null> {
    return this.repo.findOne({ where: { jobId, candidateId, deletedAt: IsNull() } })
  }

  async create(data: CreateApplicationInput): Promise<Application> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Application>): Promise<Application> {
    await this.repo.update({ id }, patch as QueryDeepPartialEntity<Application>)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Application not found after update')
    return updated
  }

  async updateStage(id: string, stage: PipelineStage): Promise<Application> {
    await this.repo.update({ id }, { currentStage: stage })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Application not found after update')
    return updated
  }
}
