import client from './client'
import type { OrgRole, ReadInviteDTO } from '../types/api'

export const invitesApi = {
  list: async (orgId: string): Promise<ReadInviteDTO[]> => (await client.get(`/orgs/${orgId}/invites`)).data.data,
  create: async (orgId: string, body: { email: string; role: OrgRole }): Promise<ReadInviteDTO> =>
    (await client.post(`/orgs/${orgId}/invites`, body)).data.data,
  revoke: async (orgId: string, inviteId: string): Promise<void> => { await client.delete(`/orgs/${orgId}/invites/${inviteId}`) },
  resend: async (orgId: string, inviteId: string): Promise<ReadInviteDTO> =>
    (await client.post(`/orgs/${orgId}/invites/${inviteId}/resend`, {})).data.data,
}
