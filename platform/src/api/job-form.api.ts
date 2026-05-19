import client from './client'
import type { ReadJobFormDTO, ReadJobFormFieldDTO, ReadJobFormSectionDTO } from '../types/api'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function stripTempId<T extends { id?: string | null }>({ id, ...rest }: T): T {
  return (id && UUID_RE.test(id) ? { id, ...rest } : (rest as T))
}

export const jobFormApi = {
  get: async (orgId: string, jobId: string): Promise<ReadJobFormDTO | null> =>
    (await client.get(`/orgs/${orgId}/jobs/${jobId}/form`)).data.data,
  save: async (
    orgId: string,
    jobId: string,
    body: { sections: Partial<ReadJobFormSectionDTO>[]; fields: Partial<ReadJobFormFieldDTO>[] },
  ): Promise<ReadJobFormDTO> => {
    const sectionIdMap = new Map<string, string | undefined>()
    const sections = body.sections.map((s) => {
      const cleaned = stripTempId(s)
      if (s.id && s.id !== cleaned.id) sectionIdMap.set(s.id, cleaned.id)
      return cleaned
    })
    const fields = body.fields.map((f) => {
      const cleaned = stripTempId(f)
      if (cleaned.sectionId && !UUID_RE.test(cleaned.sectionId)) {
        cleaned.sectionId = sectionIdMap.get(cleaned.sectionId) ?? null
      }
      return cleaned
    })
    return (await client.put(`/orgs/${orgId}/jobs/${jobId}/form`, { sections, fields })).data.data
  },
}
