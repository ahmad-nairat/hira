import client from './client'
import type { OnboardingStatus, OrgRole, ReadInviteDTO, ReadOrgDTO } from '../types/api'

export const onboardingApi = {
  check: async (): Promise<OnboardingStatus> => (await client.get('/onboarding/check')).data.data,
  createOrg: async (body: { name: string; slug: string }): Promise<ReadOrgDTO> =>
    (await client.post('/onboarding/orgs', body)).data.data,
  requestJoin: async (): Promise<{ orgId: string; autoJoined: boolean; role: OrgRole | null }> =>
    (await client.post('/onboarding/request-join', {})).data.data,
  getInvite: async (token: string): Promise<ReadInviteDTO> =>
    (await client.get(`/onboarding/invites/${token}`)).data.data,
  acceptInvite: async (token: string): Promise<{ orgId: string; role: OrgRole }> =>
    (await client.post(`/onboarding/invites/${token}/accept`, {})).data.data,
  declineInvite: async (token: string): Promise<void> => {
    await client.post(`/onboarding/invites/${token}/decline`, {})
  },
}
