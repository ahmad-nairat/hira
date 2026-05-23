import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from './data-source'
import { Application } from '../../core/entities/application.entity'
import { JobForm } from '../../core/entities/job-form.entity'
import { buildFormAnswers } from '../../core/dtos/application.dto'

/**
 * One-off backfill: converts every application's `formAnswers` from the legacy
 * `{ fieldId: answer }` map into the self-describing `{ id, question, type, answer }[]`
 * array. The `jsonb` column type is unchanged, so no schema migration is required.
 *
 * Idempotent — rows already stored as an array are skipped, so it is safe to re-run.
 * Run with: npm run backfill:form-answers
 */
async function run(): Promise<void> {
  await AppDataSource.initialize()
  console.log('Backfilling formAnswers into the { id, question, type, answer } array shape...')

  const appRepo = AppDataSource.getRepository(Application)
  const formRepo = AppDataSource.getRepository(JobForm)

  const applications = await appRepo.find({ withDeleted: true })
  const formCache = new Map<string, JobForm | null>()

  let converted = 0
  let skipped = 0
  let emptied = 0

  for (const app of applications) {
    if (Array.isArray(app.formAnswers)) {
      skipped++
      continue
    }

    let form = formCache.get(app.jobId)
    if (form === undefined) {
      form = await formRepo.findOne({ where: { jobId: app.jobId }, relations: ['fields'] })
      formCache.set(app.jobId, form)
    }

    const rawAnswers = (app.formAnswers ?? {}) as unknown as Record<string, unknown>
    const next = form ? buildFormAnswers(form.fields, rawAnswers) : []
    app.formAnswers = next
    await appRepo.save(app)

    converted++
    if (next.length === 0) emptied++
    console.log(`  application ${app.id}: ${Object.keys(rawAnswers).length} key(s) -> ${next.length} answer(s)`)
  }

  console.log(
    `Backfill complete. converted=${converted}, skipped (already array)=${skipped}, emptied (no field match)=${emptied}`,
  )
  await AppDataSource.destroy()
}

run().catch((err) => {
  console.error('Backfill failed', err)
  process.exit(1)
})
