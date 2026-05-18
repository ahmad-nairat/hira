import { z } from 'zod'
import { Interview, InterviewStage, InterviewStatus, MeetingType } from '../entities/interview.entity'
import { InterviewFeedback, Recommendation } from '../entities/interview-feedback.entity'

export const CreateInterviewSchema = z.object({
  stage: z.nativeEnum(InterviewStage),
  interviewerId: z.string().uuid(),
  scheduledAt: z.string().datetime().nullable().optional(),
  meetingType: z.nativeEnum(MeetingType),
  meetingLink: z.string().url().nullable().optional(),
  meetingAddress: z.string().max(500).nullable().optional(),
})

export const UpdateInterviewSchema = z.object({
  interviewerId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  meetingType: z.nativeEnum(MeetingType).optional(),
  meetingLink: z.string().url().nullable().optional(),
  meetingAddress: z.string().max(500).nullable().optional(),
  status: z.nativeEnum(InterviewStatus).optional(),
  candidateNotified: z.boolean().optional(),
})

export const SubmitFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  notes: z.string().min(1).max(10_000),
  recommendation: z.nativeEnum(Recommendation),
})

export type CreateInterviewDTO = z.infer<typeof CreateInterviewSchema>
export type UpdateInterviewDTO = z.infer<typeof UpdateInterviewSchema>
export type SubmitFeedbackDTO = z.infer<typeof SubmitFeedbackSchema>

export interface ReadInterviewDTO {
  id: string
  applicationId: string
  orgId: string
  stage: InterviewStage
  interviewerId: string
  scheduledAt: string | null
  meetingType: MeetingType
  meetingLink: string | null
  meetingAddress: string | null
  candidateNotified: boolean
  status: InterviewStatus
  createdAt: string
  updatedAt: string
}

export function toReadInterviewDTO(i: Interview): ReadInterviewDTO {
  return {
    id: i.id,
    applicationId: i.applicationId,
    orgId: i.orgId,
    stage: i.stage,
    interviewerId: i.interviewerId,
    scheduledAt: i.scheduledAt?.toISOString() ?? null,
    meetingType: i.meetingType,
    meetingLink: i.meetingLink,
    meetingAddress: i.meetingAddress,
    candidateNotified: i.candidateNotified,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }
}

export interface ReadInterviewFeedbackDTO {
  id: string
  interviewId: string
  submittedBy: string
  rating: number
  notes: string
  recommendation: Recommendation
  createdAt: string
}

export function toReadInterviewFeedbackDTO(f: InterviewFeedback): ReadInterviewFeedbackDTO {
  return {
    id: f.id,
    interviewId: f.interviewId,
    submittedBy: f.submittedBy,
    rating: f.rating,
    notes: f.notes,
    recommendation: f.recommendation,
    createdAt: f.createdAt.toISOString(),
  }
}
