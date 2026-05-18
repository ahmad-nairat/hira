import { JobForm } from '../entities/job-form.entity'
import { JobFormSection } from '../entities/job-form-section.entity'
import { JobFormField } from '../entities/job-form-field.entity'

export interface SaveJobFormInput {
  jobId: string
  sections: Array<Partial<JobFormSection>>
  fields: Array<Partial<JobFormField>>
}

export interface IJobFormRepo {
  findByJob(jobId: string): Promise<JobForm | null>
  save(input: SaveJobFormInput): Promise<JobForm>
}
