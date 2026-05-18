import { z } from 'zod'
import { Application, PipelineStage } from '../entities/application.entity'

export const MoveApplicationSchema = z.object({
  toStage: z.nativeEnum(PipelineStage),
  note: z.string().max(2000).optional(),
})

export const RejectApplicationSchema = z.object({
  note: z.string().min(1).max(2000),
})

export const ApplicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  stage: z.nativeEnum(PipelineStage).optional(),
  search: z.string().optional(),
})

export type MoveApplicationDTO = z.infer<typeof MoveApplicationSchema>
export type RejectApplicationDTO = z.infer<typeof RejectApplicationSchema>
export type ApplicationQueryDTO = z.infer<typeof ApplicationQuerySchema>

export interface ReadApplicationDTO {
  id: string
  jobId: string
  candidateId: string
  orgId: string
  currentStage: PipelineStage
  score: number | null
  formAnswers: Record<string, unknown>
  resumeUrl: string
  rejectionNote: string | null
  hasOutdatedScore: boolean
  createdAt: string
  updatedAt: string
}

export function toReadApplicationDTO(a: Application): ReadApplicationDTO {
  return {
    id: a.id,
    jobId: a.jobId,
    candidateId: a.candidateId,
    orgId: a.orgId,
    currentStage: a.currentStage,
    score: a.score,
    formAnswers: a.formAnswers,
    resumeUrl: a.resumeUrl,
    rejectionNote: a.rejectionNote,
    hasOutdatedScore: a.hasOutdatedScore,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }
}

/**
 * Limited view for the Interviewer role — strips AI scores and other sensitive fields.
 */
export interface InterviewerApplicationDTO {
  id: string
  jobId: string
  candidateId: string
  currentStage: PipelineStage
  resumeUrl: string
  formAnswers: Record<string, unknown>
  createdAt: string
}

export function toInterviewerApplicationDTO(a: Application): InterviewerApplicationDTO {
  return {
    id: a.id,
    jobId: a.jobId,
    candidateId: a.candidateId,
    currentStage: a.currentStage,
    resumeUrl: a.resumeUrl,
    formAnswers: a.formAnswers,
    createdAt: a.createdAt.toISOString(),
  }
}
