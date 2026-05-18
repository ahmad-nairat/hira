import { z } from 'zod'
import { Note } from '../entities/note.entity'

export const CreateNoteSchema = z.object({
  content: z.string().min(1).max(10_000),
})

export const UpdateNoteSchema = z.object({
  content: z.string().min(1).max(10_000),
})

export type CreateNoteDTO = z.infer<typeof CreateNoteSchema>
export type UpdateNoteDTO = z.infer<typeof UpdateNoteSchema>

export interface ReadNoteDTO {
  id: string
  applicationId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
}

export function toReadNoteDTO(n: Note): ReadNoteDTO {
  return {
    id: n.id,
    applicationId: n.applicationId,
    authorId: n.authorId,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }
}
