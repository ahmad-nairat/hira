import { z } from 'zod'
import { Application, FormAnswer, PipelineStage, ScoreBreakdown } from '../entities/application.entity'
import { JobFormField } from '../entities/job-form-field.entity'

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
  scoreBreakdown: ScoreBreakdown | null
  formAnswers: FormAnswer[]
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
    scoreBreakdown: a.scoreBreakdown,
    formAnswers: a.formAnswers,
    resumeUrl: a.resumeUrl,
    rejectionNote: a.rejectionNote,
    hasOutdatedScore: a.hasOutdatedScore,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }
}

/**
 * Limited view for the Interviewer role — strips AI scores, rejection notes,
 * and other sensitive recruiter-facing fields. Carries the candidate name and
 * job title denormalised so the interview detail page can render without
 * calling the candidate/job endpoints (which interviewers can't access).
 */
export interface InterviewerApplicationDTO {
  id: string
  jobId: string
  jobTitle: string
  candidateId: string
  candidateName: string
  currentStage: PipelineStage
  resumeUrl: string
  formAnswers: FormAnswer[]
  createdAt: string
}

export function toInterviewerApplicationDTO(a: Application): InterviewerApplicationDTO {
  return {
    id: a.id,
    jobId: a.jobId,
    jobTitle: a.job?.title ?? '',
    candidateId: a.candidateId,
    candidateName: a.candidate?.fullName ?? '',
    currentStage: a.currentStage,
    resumeUrl: a.resumeUrl,
    formAnswers: a.formAnswers,
    createdAt: a.createdAt.toISOString(),
  }
}

/**
 * Joins a job form's fields with a raw `{ fieldId: answer }` map to produce the
 * denormalised, self-describing answers stored on an application. Fields are ordered
 * by `sortOrder`; fields without an answer (incl. the resume file field) are dropped.
 */
export function buildFormAnswers(
  fields: JobFormField[],
  rawAnswers: Record<string, unknown>,
): FormAnswer[] {
  return [...fields]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((f) => {
      const v = rawAnswers[f.id]
      return v !== undefined && v !== null && v !== ''
    })
    .map((f) => ({ id: f.id, question: f.label, type: f.type, answer: rawAnswers[f.id] }))
}
