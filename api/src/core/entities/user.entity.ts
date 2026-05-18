import { Entity, Column, Index } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string | null

  @Column({ type: 'varchar', length: 255 })
  fullName!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId!: string | null

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken!: string | null
}
