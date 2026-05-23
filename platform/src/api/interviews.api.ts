import client from './client'
import type { InterviewStage, MeetingType, ReadInterviewDTO, ReadInterviewFeedbackDTO, Recommendation } from '../types/api'

export const interviewsApi = {
  list: async (orgId: string): Promise<ReadInterviewDTO[]> => (await client.get(`/orgs/${orgId}/interviews`)).data.data,
  listByApplication: async (orgId: string, applicationId: string): Promise<ReadInterviewDTO[]> =>
    (await client.get(`/orgs/${orgId}/applications/${applicationId}/interviews`)).data.data,
  get: async (orgId: string, id: string): Promise<ReadInterviewDTO> => (await client.get(`/orgs/${orgId}/interviews/${id}`)).data.data,
  create: async (
    orgId: string,
    applicationId: string,
    body: { stage: InterviewStage; interviewerId: string; scheduledAt?: string | null; meetingType: MeetingType; meetingLink?: string | null; meetingAddress?: string | null },
  ): Promise<ReadInterviewDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${applicationId}/interviews`, body)).data.data,
  update: async (orgId: string, id: string, body: Partial<ReadInterviewDTO>): Promise<ReadInterviewDTO> =>
    (await client.patch(`/orgs/${orgId}/interviews/${id}`, body)).data.data,
  cancel: async (orgId: string, id: string): Promise<ReadInterviewDTO> =>
    (await client.post(`/orgs/${orgId}/interviews/${id}/cancel`, {})).data.data,
  getFeedback: async (orgId: string, id: string): Promise<ReadInterviewFeedbackDTO | null> =>
    (await client.get(`/orgs/${orgId}/interviews/${id}/feedback`)).data.data,
  submitFeedback: async (orgId: string, id: string, body: { rating: number; notes: string; recommendation: Recommendation }): Promise<ReadInterviewFeedbackDTO> =>
    (await client.post(`/orgs/${orgId}/interviews/${id}/feedback`, body)).data.data,
}
