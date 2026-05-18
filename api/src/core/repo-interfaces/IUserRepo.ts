import { User } from '../entities/user.entity'

export type CreateUserInput = Pick<User, 'email' | 'password' | 'fullName'> &
  Partial<Pick<User, 'googleId' | 'avatarUrl' | 'isEmailVerified'>>

export interface IUserRepo {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, patch: Partial<User>): Promise<User>
  softDelete(id: string): Promise<void>
}
