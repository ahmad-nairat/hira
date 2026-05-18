import client from './client'
import type { ReadOfferDTO } from '../types/api'

export interface CreateOfferBody { salary?: number | null; currency?: string | null; startDate?: string | null; contractType?: string | null; welcomeMessage?: string }

export const offersApi = {
  create: async (orgId: string, applicationId: string, body: CreateOfferBody): Promise<ReadOfferDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${applicationId}/offer`, body)).data.data,
  update: async (orgId: string, applicationId: string, body: CreateOfferBody): Promise<ReadOfferDTO> =>
    (await client.patch(`/orgs/${orgId}/applications/${applicationId}/offer`, body)).data.data,
  send: async (orgId: string, applicationId: string): Promise<ReadOfferDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${applicationId}/offer/send`, {})).data.data,
}
