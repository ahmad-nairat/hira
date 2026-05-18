import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Application } from './application.entity'
import { User } from './user.entity'

@Entity({ name: 'notes' })
@Index(['applicationId'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  applicationId!: string

  @ManyToOne(() => Application, (a) => a.notes)
  @JoinColumn({ name: 'applicationId' })
  application!: Application

  @Column({ type: 'uuid' })
  authorId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author!: User

  @Column({ type: 'text' })
  content!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
