import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { ApplicationStageHistory } from '../../core/entities/application-stage-history.entity'
import {
  IApplicationStageHistoryRepo,
  CreateStageHistoryInput,
} from '../../core/repo-interfaces/IApplicationStageHistoryRepo'

@injectable()
export class ApplicationStageHistoryRepo implements IApplicationStageHistoryRepo {
  private get repo(): Repository<ApplicationStageHistory> {
    return AppDataSource.getRepository(ApplicationStageHistory)
  }

  async findByApplication(applicationId: string): Promise<ApplicationStageHistory[]> {
    return this.repo.find({ where: { applicationId }, relations: ['movedByUser'], order: { createdAt: 'ASC' } })
  }

  async create(data: CreateStageHistoryInput): Promise<ApplicationStageHistory> {
    return this.repo.save(this.repo.create(data))
  }
}
