import client from './client'
import type { ReadJobFormDTO, ReadJobFormFieldDTO, ReadJobFormSectionDTO } from '../types/api'

export const jobFormApi = {
  get: async (orgId: string, jobId: string): Promise<ReadJobFormDTO | null> =>
    (await client.get(`/orgs/${orgId}/jobs/${jobId}/form`)).data.data,
  save: async (
    orgId: string,
    jobId: string,
    body: { sections: Partial<ReadJobFormSectionDTO>[]; fields: Partial<ReadJobFormFieldDTO>[] },
  ): Promise<ReadJobFormDTO> => (await client.put(`/orgs/${orgId}/jobs/${jobId}/form`, body)).data.data,
}
