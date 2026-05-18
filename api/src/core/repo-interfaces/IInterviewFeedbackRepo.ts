import { InterviewFeedback, Recommendation } from '../entities/interview-feedback.entity'

export interface CreateInterviewFeedbackInput {
  interviewId: string
  submittedBy: string
  rating: number
  notes: string
  recommendation: Recommendation
}

export interface IInterviewFeedbackRepo {
  findByInterview(interviewId: string): Promise<InterviewFeedback | null>
  findByApplication(applicationId: string): Promise<InterviewFeedback[]>
  create(data: CreateInterviewFeedbackInput): Promise<InterviewFeedback>
}
