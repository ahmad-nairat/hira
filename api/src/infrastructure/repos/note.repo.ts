import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Note } from '../../core/entities/note.entity'
import { INoteRepo, CreateNoteInput } from '../../core/repo-interfaces/INoteRepo'

@injectable()
export class NoteRepo implements INoteRepo {
  private get repo(): Repository<Note> {
    return AppDataSource.getRepository(Note)
  }

  async findById(id: string): Promise<Note | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByApplication(applicationId: string): Promise<Note[]> {
    return this.repo.find({
      where: { applicationId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    })
  }

  async create(data: CreateNoteInput): Promise<Note> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, content: string): Promise<Note> {
    await this.repo.update({ id }, { content })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Note not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id })
  }
}
