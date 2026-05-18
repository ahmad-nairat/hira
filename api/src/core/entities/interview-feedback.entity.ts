import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Interview } from './interview.entity'
import { User } from './user.entity'

export enum Recommendation {
  STRONG_YES = 'strong_yes',
  YES = 'yes',
  NEUTRAL = 'neutral',
  NO = 'no',
  STRONG_NO = 'strong_no',
}

@Entity({ name: 'interview_feedback' })
export class InterviewFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', unique: true })
  interviewId!: string

  @OneToOne(() => Interview, (i) => i.feedback)
  @JoinColumn({ name: 'interviewId' })
  interview!: Interview

  @Column({ type: 'uuid' })
  submittedBy!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submittedBy' })
  submittedByUser!: User

  @Column({ type: 'smallint' })
  rating!: number

  @Column({ type: 'text' })
  notes!: string

  @Column({ type: 'enum', enum: Recommendation })
  recommendation!: Recommendation

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
