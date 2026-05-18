import { JobAnalysis } from '../entities/job-analysis.entity'

export interface IJobAnalysisRepo {
  findByJob(jobId: string): Promise<JobAnalysis | null>
  upsert(jobId: string, structuredCriteria: Record<string, unknown>): Promise<JobAnalysis>
}
