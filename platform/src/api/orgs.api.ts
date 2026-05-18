import client from './client'
import type { OrgRole, ReadOrgDTO } from '../types/api'

export const orgsApi = {
  get: async (orgId: string): Promise<ReadOrgDTO> => (await client.get(`/orgs/${orgId}`)).data.data,
  update: async (orgId: string, body: Partial<ReadOrgDTO>): Promise<ReadOrgDTO> =>
    (await client.patch(`/orgs/${orgId}`, body)).data.data,
  updateBranding: async (orgId: string, body: Partial<ReadOrgDTO>): Promise<ReadOrgDTO> =>
    (await client.patch(`/orgs/${orgId}/branding`, body)).data.data,
  updateScoring: async (
    orgId: string,
    body: { scoringEducation: number; scoringSkills: number; scoringExperience: number; scoringCerts: number },
  ): Promise<ReadOrgDTO> => (await client.patch(`/orgs/${orgId}/scoring`, body)).data.data,
  updateAutoJoin: async (orgId: string, body: { autoJoinEnabled: boolean; autoJoinDefaultRole?: OrgRole | null }): Promise<ReadOrgDTO> =>
    (await client.patch(`/orgs/${orgId}/auto-join`, body)).data.data,
  delete: async (orgId: string): Promise<void> => { await client.delete(`/orgs/${orgId}`) },
}
