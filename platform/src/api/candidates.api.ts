import client from './client'
import type { CandidateQueryParams, PaginatedResponse, ReadCandidateDTO } from '../types/api'

export const candidatesApi = {
  list: async (orgId: string, params: CandidateQueryParams = {}): Promise<PaginatedResponse<ReadCandidateDTO>> =>
    (await client.get(`/orgs/${orgId}/candidates`, { params })).data,
  get: async (orgId: string, id: string): Promise<ReadCandidateDTO> => (await client.get(`/orgs/${orgId}/candidates/${id}`)).data.data,
  create: async (orgId: string, body: { email: string; fullName: string; phone?: string | null; linkedinUrl?: string | null }): Promise<ReadCandidateDTO> =>
    (await client.post(`/orgs/${orgId}/candidates`, body)).data.data,
  update: async (orgId: string, id: string, body: Partial<ReadCandidateDTO>): Promise<ReadCandidateDTO> =>
    (await client.patch(`/orgs/${orgId}/candidates/${id}`, body)).data.data,
  blacklist: async (
    orgId: string, id: string,
    body: { reason: string; durationType: 'months_6' | 'months_12' | 'permanent' | 'custom'; expiresAt?: string | null },
  ): Promise<void> => { await client.post(`/orgs/${orgId}/candidates/${id}/blacklist`, body) },
  unblacklist: async (orgId: string, id: string): Promise<void> => { await client.delete(`/orgs/${orgId}/candidates/${id}/blacklist`) },
  suggest: async (orgId: string, id: string, jobId: string): Promise<void> => { await client.post(`/orgs/${orgId}/candidates/${id}/suggest`, { jobId }) },
}
