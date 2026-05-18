import { Interview, InterviewStage, InterviewStatus, MeetingType } from '../entities/interview.entity'

export interface CreateInterviewInput {
  applicationId: string
  orgId: string
  stage: InterviewStage
  interviewerId: string
  scheduledAt: Date | null
  meetingType: MeetingType
  meetingLink?: string | null
  meetingAddress?: string | null
}

export interface IInterviewRepo {
  findById(id: string): Promise<Interview | null>
  findByApplication(applicationId: string): Promise<Interview[]>
  findByInterviewer(interviewerId: string): Promise<Interview[]>
  findByOrg(orgId: string): Promise<Interview[]>
  create(data: CreateInterviewInput): Promise<Interview>
  update(id: string, patch: Partial<Interview>): Promise<Interview>
  updateStatus(id: string, status: InterviewStatus): Promise<Interview>
  softDelete(id: string): Promise<void>
}
