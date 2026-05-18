import { Entity, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Org } from './org.entity'
import { User } from './user.entity'
import { JobForm } from './job-form.entity'

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
}

@Entity({ name: 'jobs' })
@Index(['orgId', 'status'])
export class Job extends BaseEntity {
  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'uuid' })
  recruiterId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recruiterId' })
  recruiter!: User

  @Column({ type: 'uuid', nullable: true })
  hiringManagerId!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'hiringManagerId' })
  hiringManager!: User | null

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'varchar', length: 255 })
  location!: string

  @Column({ type: 'enum', enum: JobType })
  type!: JobType

  @Column({ type: 'integer', nullable: true })
  salaryMin!: number | null

  @Column({ type: 'integer', nullable: true })
  salaryMax!: number | null

  @Column({ type: 'varchar', length: 3, nullable: true })
  salaryCurrency!: string | null

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null

  @Column({ type: 'text', array: true, default: '{}' })
  rejectionCriteria!: string[]

  @Column({ type: 'text', array: true, default: '{}' })
  scoringInstructions!: string[]

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  scoringEducation!: number | null

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  scoringSkills!: number | null

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  scoringExperience!: number | null

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  scoringCerts!: number | null

  @Column({ type: 'boolean', default: false })
  hasOutdatedScores!: boolean

  @Column({ type: 'boolean', default: false })
  hasOutdatedRejections!: boolean

  @OneToOne(() => JobForm, (f) => f.job)
  form!: JobForm
}
