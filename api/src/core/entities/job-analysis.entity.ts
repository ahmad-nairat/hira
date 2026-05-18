import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Job } from './job.entity'

@Entity({ name: 'job_analyses' })
export class JobAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', unique: true })
  jobId!: string

  @OneToOne(() => Job)
  @JoinColumn({ name: 'jobId' })
  job!: Job

  @Column({ type: 'jsonb' })
  structuredCriteria!: Record<string, unknown>

  @Column({ type: 'timestamptz' })
  analyzedAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
