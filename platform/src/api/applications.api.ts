import client from './client'
import type { ApplicationQueryParams, PaginatedResponse, PipelineStage, ReadApplicationDTO, ReadStageHistoryDTO } from '../types/api'

export const applicationsApi = {
  listByJob: async (orgId: string, jobId: string, params: ApplicationQueryParams = {}): Promise<PaginatedResponse<ReadApplicationDTO>> =>
    (await client.get(`/orgs/${orgId}/jobs/${jobId}/applications`, { params })).data,
  get: async (orgId: string, id: string): Promise<ReadApplicationDTO> => (await client.get(`/orgs/${orgId}/applications/${id}`)).data.data,
  move: async (orgId: string, id: string, toStage: PipelineStage, note?: string): Promise<ReadApplicationDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${id}/move`, { toStage, note })).data.data,
  reject: async (orgId: string, id: string, note: string): Promise<ReadApplicationDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${id}/reject`, { note })).data.data,
  approve: async (orgId: string, id: string): Promise<ReadApplicationDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${id}/approve`, {})).data.data,
  hire: async (orgId: string, id: string): Promise<ReadApplicationDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${id}/hire`, {})).data.data,
  stageHistory: async (orgId: string, id: string): Promise<ReadStageHistoryDTO[]> =>
    (await client.get(`/orgs/${orgId}/applications/${id}/stage-history`)).data.data,
}
