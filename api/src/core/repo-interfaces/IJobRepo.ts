import { Job } from '../entities/job.entity'
import { JobQueryDTO } from '../dtos/job.dto'

export type CreateJobInput = Partial<Job> & Pick<Job, 'orgId' | 'recruiterId' | 'title' | 'description' | 'location' | 'type'>

export interface IJobRepo {
  findById(id: string): Promise<Job | null>
  findAll(query: JobQueryDTO, orgId: string): Promise<[Job[], number]>
  findPublishedByOrg(orgId: string): Promise<Job[]>
  create(data: CreateJobInput): Promise<Job>
  update(id: string, patch: Partial<Job>): Promise<Job>
  softDelete(id: string): Promise<void>
}
