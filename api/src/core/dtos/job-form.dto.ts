import { z } from 'zod'
import { JobForm } from '../entities/job-form.entity'
import { JobFormField, FieldType } from '../entities/job-form-field.entity'
import { JobFormSection } from '../entities/job-form-section.entity'

const SectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  sortOrder: z.number().int().min(0),
})

const FieldSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid().nullable().optional(),
  type: z.nativeEnum(FieldType),
  label: z.string().min(1).max(255),
  placeholder: z.string().max(255).nullable().optional(),
  isRequired: z.boolean(),
  isResume: z.boolean(),
  sortOrder: z.number().int().min(0),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .nullable()
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(1).optional(),
    })
    .nullable()
    .optional(),
})

export const JobFormSchema = z
  .object({
    sections: z.array(SectionSchema),
    fields: z.array(FieldSchema).min(1),
  })
  .refine(
    (v) => v.fields.filter((f) => f.isResume && f.type === FieldType.FILE).length === 1,
    { message: 'Form must include exactly one resume file field' },
  )

export type JobFormDTO = z.infer<typeof JobFormSchema>

export interface ReadJobFormDTO {
  id: string
  jobId: string
  sections: Array<{
    id: string
    title: string
    sortOrder: number
  }>
  fields: Array<{
    id: string
    sectionId: string | null
    type: FieldType
    label: string
    placeholder: string | null
    isRequired: boolean
    isResume: boolean
    sortOrder: number
    options: Array<{ label: string; value: string }> | null
    validation: {
      min?: number
      max?: number
      minLength?: number
      maxLength?: number
    } | null
  }>
}

export function toReadJobFormDTO(form: JobForm): ReadJobFormDTO {
  return {
    id: form.id,
    jobId: form.jobId,
    sections: (form.sections ?? []).map((s: JobFormSection) => ({
      id: s.id,
      title: s.title,
      sortOrder: s.sortOrder,
    })),
    fields: (form.fields ?? []).map((f: JobFormField) => ({
      id: f.id,
      sectionId: f.sectionId,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      isRequired: f.isRequired,
      isResume: f.isResume,
      sortOrder: f.sortOrder,
      options: f.options,
      validation: f.validation,
    })),
  }
}
