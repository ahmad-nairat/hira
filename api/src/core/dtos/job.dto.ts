import { z } from 'zod'
import { Job, JobStatus, JobType } from '../entities/job.entity'

export const CreateJobSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  location: z.string().min(1).max(255),
  type: z.nativeEnum(JobType),
  salaryMin: z.number().int().positive().nullable().optional(),
  salaryMax: z.number().int().positive().nullable().optional(),
  salaryCurrency: z.string().length(3).nullable().optional(),
  hiringManagerId: z.string().uuid().nullable().optional(),
})

export const UpdateJobSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    location: z.string().min(1).max(255).optional(),
    type: z.nativeEnum(JobType).optional(),
    salaryMin: z.number().int().positive().nullable().optional(),
    salaryMax: z.number().int().positive().nullable().optional(),
    salaryCurrency: z.string().length(3).nullable().optional(),
    hiringManagerId: z.string().uuid().nullable().optional(),
    rejectionCriteria: z.array(z.string().min(1)).optional(),
    scoringInstructions: z.array(z.string().min(1)).optional(),
    scoringEducation: z.number().min(0).max(1).nullable().optional(),
    scoringSkills: z.number().min(0).max(1).nullable().optional(),
    scoringExperience: z.number().min(0).max(1).nullable().optional(),
    scoringCerts: z.number().min(0).max(1).nullable().optional(),
  })
  .strict()

export const JobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(JobStatus).optional(),
  type: z.nativeEnum(JobType).optional(),
  search: z.string().optional(),
})

export type CreateJobDTO = z.infer<typeof CreateJobSchema>
export type UpdateJobDTO = z.infer<typeof UpdateJobSchema>
export type JobQueryDTO = z.infer<typeof JobQuerySchema>

export interface ReadJobDTO {
  id: string
  orgId: string
  recruiterId: string
  hiringManagerId: string | null
  title: string
  description: string
  location: string
  type: JobType
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  status: JobStatus
  publishedAt: string | null
  rejectionCriteria: string[]
  scoringInstructions: string[]
  scoringEducation: number | null
  scoringSkills: number | null
  scoringExperience: number | null
  scoringCerts: number | null
  hasOutdatedScores: boolean
  hasOutdatedRejections: boolean
  createdAt: string
  updatedAt: string
}

export function toReadJobDTO(job: Job): ReadJobDTO {
  return {
    id: job.id,
    orgId: job.orgId,
    recruiterId: job.recruiterId,
    hiringManagerId: job.hiringManagerId,
    title: job.title,
    description: job.description,
    location: job.location,
    type: job.type,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    status: job.status,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    rejectionCriteria: job.rejectionCriteria ?? [],
    scoringInstructions: job.scoringInstructions ?? [],
    scoringEducation: job.scoringEducation === null ? null : Number(job.scoringEducation),
    scoringSkills: job.scoringSkills === null ? null : Number(job.scoringSkills),
    scoringExperience: job.scoringExperience === null ? null : Number(job.scoringExperience),
    scoringCerts: job.scoringCerts === null ? null : Number(job.scoringCerts),
    hasOutdatedScores: job.hasOutdatedScores,
    hasOutdatedRejections: job.hasOutdatedRejections,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }
}
