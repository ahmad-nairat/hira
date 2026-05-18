import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { JobForm } from '../../core/entities/job-form.entity'
import { JobFormSection } from '../../core/entities/job-form-section.entity'
import { JobFormField } from '../../core/entities/job-form-field.entity'
import { IJobFormRepo, SaveJobFormInput } from '../../core/repo-interfaces/IJobFormRepo'

@injectable()
export class JobFormRepo implements IJobFormRepo {
  private get formRepo(): Repository<JobForm> {
    return AppDataSource.getRepository(JobForm)
  }
  private get sectionRepo(): Repository<JobFormSection> {
    return AppDataSource.getRepository(JobFormSection)
  }
  private get fieldRepo(): Repository<JobFormField> {
    return AppDataSource.getRepository(JobFormField)
  }

  async findByJob(jobId: string): Promise<JobForm | null> {
    const form = await this.formRepo.findOne({
      where: { jobId },
      relations: ['sections', 'fields'],
    })
    if (form) {
      form.sections.sort((a, b) => a.sortOrder - b.sortOrder)
      form.fields.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return form
  }

  async save(input: SaveJobFormInput): Promise<JobForm> {
    return AppDataSource.transaction(async (manager) => {
      let form = await manager.findOne(JobForm, { where: { jobId: input.jobId } })
      if (!form) {
        form = manager.create(JobForm, { jobId: input.jobId })
        form = await manager.save(form)
      } else {
        await manager.delete(JobFormField, { jobFormId: form.id })
        await manager.delete(JobFormSection, { jobFormId: form.id })
      }

      const sectionIdRemap = new Map<string, string>()
      const newSections = await Promise.all(
        input.sections.map(async (s) => {
          const created = manager.create(JobFormSection, {
            jobFormId: form!.id,
            title: s.title ?? '',
            sortOrder: s.sortOrder ?? 0,
          })
          const saved = await manager.save(created)
          if (s.id) sectionIdRemap.set(s.id, saved.id)
          return saved
        }),
      )

      await Promise.all(
        input.fields.map((f) =>
          manager.save(
            manager.create(JobFormField, {
              jobFormId: form!.id,
              sectionId: f.sectionId ? sectionIdRemap.get(f.sectionId) ?? f.sectionId : null,
              type: f.type!,
              label: f.label ?? '',
              placeholder: f.placeholder ?? null,
              isRequired: f.isRequired ?? false,
              isResume: f.isResume ?? false,
              sortOrder: f.sortOrder ?? 0,
              options: f.options ?? null,
              validation: f.validation ?? null,
            }),
          ),
        ),
      )

      const reloaded = await manager.findOne(JobForm, {
        where: { id: form.id },
        relations: ['sections', 'fields'],
      })
      if (!reloaded) throw new Error('Form save failed')
      reloaded.sections.sort((a, b) => a.sortOrder - b.sortOrder)
      reloaded.fields.sort((a, b) => a.sortOrder - b.sortOrder)
      void newSections
      return reloaded
    })
  }
}
