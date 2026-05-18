import client from './client'
import type { ReadOrgDomainDTO } from '../types/api'

export const domainsApi = {
  get: async (orgId: string): Promise<ReadOrgDomainDTO | null> => (await client.get(`/orgs/${orgId}/domain`)).data.data,
  submit: async (orgId: string, domain: string): Promise<ReadOrgDomainDTO> => (await client.post(`/orgs/${orgId}/domain`, { domain })).data.data,
  verify: async (orgId: string): Promise<ReadOrgDomainDTO> => (await client.post(`/orgs/${orgId}/domain/verify`, {})).data.data,
  remove: async (orgId: string): Promise<void> => { await client.delete(`/orgs/${orgId}/domain`) },
}
