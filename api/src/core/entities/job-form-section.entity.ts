import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { JobForm } from './job-form.entity'

@Entity({ name: 'job_form_sections' })
export class JobFormSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  jobFormId!: string

  @ManyToOne(() => JobForm, (f) => f.sections)
  @JoinColumn({ name: 'jobFormId' })
  form!: JobForm

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'integer' })
  sortOrder!: number
}
