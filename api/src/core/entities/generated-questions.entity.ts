import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Application } from './application.entity'
import { Interview } from './interview.entity'
import { User } from './user.entity'

export interface QuestionItem {
  question: string
  answer: string | null
}

@Entity({ name: 'generated_questions' })
@Index(['applicationId'])
export class GeneratedQuestions {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  applicationId!: string

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'applicationId' })
  application!: Application

  @Column({ type: 'uuid', nullable: true })
  interviewId!: string | null

  @ManyToOne(() => Interview, { nullable: true })
  @JoinColumn({ name: 'interviewId' })
  interview!: Interview | null

  @Column({ type: 'uuid' })
  generatedBy!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generatedBy' })
  generatedByUser!: User

  @Column({ type: 'text', nullable: true })
  instructions!: string | null

  @Column({ type: 'jsonb' })
  questions!: QuestionItem[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
