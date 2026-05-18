import { ApplicationStageHistory } from '../entities/application-stage-history.entity'
import { PipelineStage } from '../entities/application.entity'

export interface CreateStageHistoryInput {
  applicationId: string
  fromStage: PipelineStage | null
  toStage: PipelineStage
  movedBy: string | null
  note?: string | null
}

export interface IApplicationStageHistoryRepo {
  findByApplication(applicationId: string): Promise<ApplicationStageHistory[]>
  create(data: CreateStageHistoryInput): Promise<ApplicationStageHistory>
}
