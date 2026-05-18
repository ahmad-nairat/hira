import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Job } from './job.entity'
import { JobFormSection } from './job-form-section.entity'
import { JobFormField } from './job-form-field.entity'

@Entity({ name: 'job_forms' })
export class JobForm {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', unique: true })
  jobId!: string

  @OneToOne(() => Job, (j) => j.form)
  @JoinColumn({ name: 'jobId' })
  job!: Job

  @OneToMany(() => JobFormSection, (s) => s.form, { cascade: true })
  sections!: JobFormSection[]

  @OneToMany(() => JobFormField, (f) => f.form, { cascade: true })
  fields!: JobFormField[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
