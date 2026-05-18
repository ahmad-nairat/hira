import { Entity, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Application } from './application.entity'
import { Org } from './org.entity'
import { User } from './user.entity'
import { InterviewFeedback } from './interview-feedback.entity'

export enum InterviewStage {
  INTERVIEW = 'interview',
  SPECIALIST_INTERVIEW = 'specialist_interview',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MeetingType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
}

@Entity({ name: 'interviews' })
@Index(['applicationId'])
@Index(['interviewerId'])
export class Interview extends BaseEntity {
  @Column({ type: 'uuid' })
  applicationId!: string

  @ManyToOne(() => Application, (a) => a.interviews)
  @JoinColumn({ name: 'applicationId' })
  application!: Application

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'enum', enum: InterviewStage })
  stage!: InterviewStage

  @Column({ type: 'uuid' })
  interviewerId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'interviewerId' })
  interviewer!: User

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null

  @Column({ type: 'enum', enum: MeetingType })
  meetingType!: MeetingType

  @Column({ type: 'varchar', nullable: true })
  meetingLink!: string | null

  @Column({ type: 'varchar', nullable: true })
  meetingAddress!: string | null

  @Column({ type: 'varchar', nullable: true })
  calendarEventId!: string | null

  @Column({ type: 'boolean', default: false })
  candidateNotified!: boolean

  @Column({ type: 'enum', enum: InterviewStatus, default: InterviewStatus.SCHEDULED })
  status!: InterviewStatus

  @OneToOne(() => InterviewFeedback, (f) => f.interview)
  feedback!: InterviewFeedback
}
