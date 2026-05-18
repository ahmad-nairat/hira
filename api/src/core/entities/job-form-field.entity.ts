import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { JobForm } from './job-form.entity'
import { JobFormSection } from './job-form-section.entity'

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  FILE = 'file',
}

export interface FieldOption {
  label: string
  value: string
}

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

@Entity({ name: 'job_form_fields' })
@Index(['jobFormId'])
export class JobFormField {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  jobFormId!: string

  @ManyToOne(() => JobForm, (f) => f.fields)
  @JoinColumn({ name: 'jobFormId' })
  form!: JobForm

  @Column({ type: 'uuid', nullable: true })
  sectionId!: string | null

  @ManyToOne(() => JobFormSection, { nullable: true })
  @JoinColumn({ name: 'sectionId' })
  section!: JobFormSection | null

  @Column({ type: 'enum', enum: FieldType })
  type!: FieldType

  @Column({ type: 'varchar', length: 255 })
  label!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder!: string | null

  @Column({ type: 'boolean', default: false })
  isRequired!: boolean

  @Column({ type: 'boolean', default: false })
  isResume!: boolean

  @Column({ type: 'integer' })
  sortOrder!: number

  @Column({ type: 'jsonb', nullable: true })
  options!: FieldOption[] | null

  @Column({ type: 'jsonb', nullable: true })
  validation!: FieldValidation | null
}
