import client from './client'
import type { JobQueryParams, PaginatedResponse, ReadJobDTO } from '../types/api'

export const jobsApi = {
  list: async (orgId: string, params: JobQueryParams = {}): Promise<PaginatedResponse<ReadJobDTO>> =>
    (await client.get(`/orgs/${orgId}/jobs`, { params })).data,
  get: async (orgId: string, jobId: string): Promise<ReadJobDTO> => (await client.get(`/orgs/${orgId}/jobs/${jobId}`)).data.data,
  create: async (orgId: string, body: Partial<ReadJobDTO>): Promise<ReadJobDTO> => (await client.post(`/orgs/${orgId}/jobs`, body)).data.data,
  update: async (orgId: string, jobId: string, body: Partial<ReadJobDTO>): Promise<ReadJobDTO> =>
    (await client.patch(`/orgs/${orgId}/jobs/${jobId}`, body)).data.data,
  publish: async (orgId: string, jobId: string): Promise<ReadJobDTO> => (await client.post(`/orgs/${orgId}/jobs/${jobId}/publish`, {})).data.data,
  close: async (orgId: string, jobId: string): Promise<ReadJobDTO> => (await client.post(`/orgs/${orgId}/jobs/${jobId}/close`, {})).data.data,
  archive: async (orgId: string, jobId: string): Promise<ReadJobDTO> => (await client.post(`/orgs/${orgId}/jobs/${jobId}/archive`, {})).data.data,
  rescore: async (orgId: string, jobId: string): Promise<void> => { await client.post(`/orgs/${orgId}/jobs/${jobId}/rescore`, {}) },
  reevaluateRejections: async (orgId: string, jobId: string): Promise<void> => {
    await client.post(`/orgs/${orgId}/jobs/${jobId}/reevaluate-rejections`, {})
  },
}
