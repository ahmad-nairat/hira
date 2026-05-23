import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AppDataSource } from '../database/data-source'
import { Interview, InterviewStatus } from '../../core/entities/interview.entity'
import { IInterviewRepo, CreateInterviewInput } from '../../core/repo-interfaces/IInterviewRepo'

@injectable()
export class InterviewRepo implements IInterviewRepo {
  private get repo(): Repository<Interview> {
    return AppDataSource.getRepository(Interview)
  }

  async findById(id: string): Promise<Interview | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['application', 'interviewer'],
    })
  }

  async findByApplication(applicationId: string): Promise<Interview[]> {
    return this.repo.find({
      where: { applicationId, deletedAt: IsNull() },
      // Load feedback + interviewer in one round trip so the application
      // detail page can show feedback inline without per-interview fetches.
      relations: ['feedback', 'interviewer'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async findByInterviewer(interviewerId: string): Promise<Interview[]> {
    return this.repo.find({
      where: { interviewerId, deletedAt: IsNull() },
      relations: ['application'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async findByOrg(orgId: string): Promise<Interview[]> {
    return this.repo.find({
      where: { orgId, deletedAt: IsNull() },
      relations: ['application', 'interviewer'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async create(data: CreateInterviewInput): Promise<Interview> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Interview>): Promise<Interview> {
    await this.repo.update({ id }, patch as QueryDeepPartialEntity<Interview>)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Interview not found after update')
    return updated
  }

  async updateStatus(id: string, status: InterviewStatus): Promise<Interview> {
    await this.repo.update({ id }, { status })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Interview not found after update')
    return updated
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
