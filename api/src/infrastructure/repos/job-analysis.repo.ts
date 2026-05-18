import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AppDataSource } from '../database/data-source'
import { JobAnalysis } from '../../core/entities/job-analysis.entity'
import { IJobAnalysisRepo } from '../../core/repo-interfaces/IJobAnalysisRepo'

@injectable()
export class JobAnalysisRepo implements IJobAnalysisRepo {
  private get repo(): Repository<JobAnalysis> {
    return AppDataSource.getRepository(JobAnalysis)
  }

  async findByJob(jobId: string): Promise<JobAnalysis | null> {
    return this.repo.findOne({ where: { jobId } })
  }

  async upsert(jobId: string, structuredCriteria: Record<string, unknown>): Promise<JobAnalysis> {
    const existing = await this.findByJob(jobId)
    if (existing) {
      await this.repo.update(
        { id: existing.id },
        { structuredCriteria, analyzedAt: new Date() } as QueryDeepPartialEntity<JobAnalysis>,
      )
      const updated = await this.findByJob(jobId)
      if (!updated) throw new Error('Job analysis not found after upsert')
      return updated
    }
    return this.repo.save(this.repo.create({ jobId, structuredCriteria, analyzedAt: new Date() }))
  }
}
