import { Note } from '../entities/note.entity'

export interface CreateNoteInput {
  applicationId: string
  authorId: string
  content: string
}

export interface INoteRepo {
  findById(id: string): Promise<Note | null>
  findByApplication(applicationId: string): Promise<Note[]>
  create(data: CreateNoteInput): Promise<Note>
  update(id: string, content: string): Promise<Note>
  delete(id: string): Promise<void>
}
