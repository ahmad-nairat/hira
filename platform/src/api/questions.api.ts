import client from './client'
import type { QuestionItem, ReadGeneratedQuestionsDTO } from '../types/api'

export const questionsApi = {
  list: async (orgId: string, applicationId: string): Promise<ReadGeneratedQuestionsDTO[]> =>
    (await client.get(`/orgs/${orgId}/applications/${applicationId}/questions`)).data.data,
  generate: async (orgId: string, applicationId: string, body: { interviewId?: string | null; instructions?: string }): Promise<void> => {
    await client.post(`/orgs/${orgId}/applications/${applicationId}/questions/generate`, body)
  },
  updateAnswers: async (orgId: string, applicationId: string, questionsId: string, questions: QuestionItem[]): Promise<ReadGeneratedQuestionsDTO> =>
    (await client.patch(`/orgs/${orgId}/applications/${applicationId}/questions/${questionsId}/answers`, { questions })).data.data,
}
