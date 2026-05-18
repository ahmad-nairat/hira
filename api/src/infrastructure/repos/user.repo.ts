import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { User } from '../../core/entities/user.entity'
import { IUserRepo, CreateUserInput } from '../../core/repo-interfaces/IUserRepo'

@injectable()
export class UserRepo implements IUserRepo {
  private get repo(): Repository<User> {
    return AppDataSource.getRepository(User)
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase(), deletedAt: IsNull() } })
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { googleId, deletedAt: IsNull() } })
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<User>): Promise<User> {
    await this.repo.update({ id }, patch)
    const updated = await this.findById(id)
    if (!updated) throw new Error('User not found after update')
    return updated
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
