import client from './client'
import type { ReadAccessRequestDTO } from '../types/api'

export const accessRequestsApi = {
  list: async (orgId: string): Promise<ReadAccessRequestDTO[]> => (await client.get(`/orgs/${orgId}/access-requests`)).data.data,
  approve: async (orgId: string, id: string): Promise<void> => { await client.post(`/orgs/${orgId}/access-requests/${id}/approve`, {}) },
  reject: async (orgId: string, id: string): Promise<void> => { await client.post(`/orgs/${orgId}/access-requests/${id}/reject`, {}) },
}
