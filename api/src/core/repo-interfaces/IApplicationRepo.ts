import { Application, FormAnswer, PipelineStage } from '../entities/application.entity'

export interface CreateApplicationInput {
  jobId: string
  candidateId: string
  orgId: string
  formAnswers: FormAnswer[]
  resumeUrl: string
  currentStage: PipelineStage
}

export interface ApplicationQueryDTO {
  page: number
  limit: number
  stage?: PipelineStage
  search?: string
}

export interface IApplicationRepo {
  findById(id: string): Promise<Application | null>
  findByJob(jobId: string, query: ApplicationQueryDTO): Promise<[Application[], number]>
  findByCandidate(candidateId: string): Promise<Application[]>
  findByJobAndCandidate(jobId: string, candidateId: string): Promise<Application | null>
  create(data: CreateApplicationInput): Promise<Application>
  update(id: string, patch: Partial<Application>): Promise<Application>
  updateStage(id: string, stage: PipelineStage): Promise<Application>
}
