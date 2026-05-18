import client from './client'
import type { OrgRole, ReadMemberDTO } from '../types/api'

export const membersApi = {
  list: async (orgId: string): Promise<ReadMemberDTO[]> => (await client.get(`/orgs/${orgId}/members`)).data.data,
  updateRole: async (orgId: string, userId: string, role: OrgRole): Promise<ReadMemberDTO> =>
    (await client.patch(`/orgs/${orgId}/members/${userId}/role`, { role })).data.data,
  remove: async (orgId: string, userId: string): Promise<void> => { await client.delete(`/orgs/${orgId}/members/${userId}`) },
}
