import client from './client'
import type { ReadNoteDTO } from '../types/api'

export const notesApi = {
  list: async (orgId: string, applicationId: string): Promise<ReadNoteDTO[]> =>
    (await client.get(`/orgs/${orgId}/applications/${applicationId}/notes`)).data.data,
  create: async (orgId: string, applicationId: string, content: string): Promise<ReadNoteDTO> =>
    (await client.post(`/orgs/${orgId}/applications/${applicationId}/notes`, { content })).data.data,
  update: async (orgId: string, applicationId: string, noteId: string, content: string): Promise<ReadNoteDTO> =>
    (await client.patch(`/orgs/${orgId}/applications/${applicationId}/notes/${noteId}`, { content })).data.data,
  remove: async (orgId: string, applicationId: string, noteId: string): Promise<void> => {
    await client.delete(`/orgs/${orgId}/applications/${applicationId}/notes/${noteId}`)
  },
}
