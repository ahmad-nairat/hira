import 'reflect-metadata'
import * as dotenv from 'dotenv'
import bcrypt from 'bcrypt'
dotenv.config()

import { AppDataSource } from './data-source'
import { User } from '../../core/entities/user.entity'
import { Org } from '../../core/entities/org.entity'
import { OrgMembership, OrgRole } from '../../core/entities/org-membership.entity'
import { Job, JobStatus, JobType } from '../../core/entities/job.entity'
import { JobForm } from '../../core/entities/job-form.entity'
import { JobFormField, FieldType } from '../../core/entities/job-form-field.entity'
import { Candidate, CandidateSource } from '../../core/entities/candidate.entity'
import { Application, PipelineStage } from '../../core/entities/application.entity'

async function run(): Promise<void> {
  await AppDataSource.initialize()
  console.log('Seeding...')

  const userRepo = AppDataSource.getRepository(User)
  const orgRepo = AppDataSource.getRepository(Org)
  const memberRepo = AppDataSource.getRepository(OrgMembership)
  const jobRepo = AppDataSource.getRepository(Job)
  const formRepo = AppDataSource.getRepository(JobForm)
  const fieldRepo = AppDataSource.getRepository(JobFormField)
  const candidateRepo = AppDataSource.getRepository(Candidate)
  const appRepo = AppDataSource.getRepository(Application)

  const org = await orgRepo.save(orgRepo.create({ name: 'Hira Demo', slug: 'hira-demo' }))

  const passwords = {
    admin: await bcrypt.hash('Admin1234!', 12),
    recruiter: await bcrypt.hash('Recruiter1234!', 12),
    hm: await bcrypt.hash('Manager1234!', 12),
    interviewer: await bcrypt.hash('Interview1234!', 12),
  }

  const admin = await userRepo.save(userRepo.create({ email: 'admin@hira.com', password: passwords.admin, fullName: 'Demo Admin', isEmailVerified: true }))
  const recruiter = await userRepo.save(userRepo.create({ email: 'recruiter@hira.com', password: passwords.recruiter, fullName: 'Demo Recruiter', isEmailVerified: true }))
  const hm = await userRepo.save(userRepo.create({ email: 'hm@hira.com', password: passwords.hm, fullName: 'Demo Hiring Manager', isEmailVerified: true }))
  const interviewer = await userRepo.save(userRepo.create({ email: 'interviewer@hira.com', password: passwords.interviewer, fullName: 'Demo Interviewer', isEmailVerified: true }))

  await memberRepo.save([
    memberRepo.create({ userId: admin.id, orgId: org.id, role: OrgRole.ADMIN }),
    memberRepo.create({ userId: recruiter.id, orgId: org.id, role: OrgRole.RECRUITER }),
    memberRepo.create({ userId: hm.id, orgId: org.id, role: OrgRole.HIRING_MANAGER }),
    memberRepo.create({ userId: interviewer.id, orgId: org.id, role: OrgRole.INTERVIEWER }),
  ])

  const job = await jobRepo.save(
    jobRepo.create({
      orgId: org.id,
      recruiterId: recruiter.id,
      hiringManagerId: hm.id,
      title: 'Senior Backend Engineer',
      description: '<p>We are hiring a Senior Backend Engineer to scale our platform.</p>',
      location: 'Remote',
      type: JobType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    }),
  )

  const form = await formRepo.save(formRepo.create({ jobId: job.id }))
  const [nameField, emailField] = await fieldRepo.save([
    fieldRepo.create({ jobFormId: form.id, type: FieldType.TEXT, label: 'Full Name', isRequired: true, isResume: false, sortOrder: 0 }),
    fieldRepo.create({ jobFormId: form.id, type: FieldType.TEXT, label: 'Email', isRequired: true, isResume: false, sortOrder: 1 }),
    fieldRepo.create({ jobFormId: form.id, type: FieldType.FILE, label: 'Resume', isRequired: true, isResume: true, sortOrder: 2 }),
  ])

  const candidates = await candidateRepo.save([
    candidateRepo.create({ orgId: org.id, email: 'alice@example.com', fullName: 'Alice Example', source: CandidateSource.CAREERS_PAGE }),
    candidateRepo.create({ orgId: org.id, email: 'bob@example.com', fullName: 'Bob Example', source: CandidateSource.CAREERS_PAGE }),
  ])

  await appRepo.save(
    candidates.map((c) =>
      appRepo.create({
        jobId: job.id,
        candidateId: c.id,
        orgId: org.id,
        formAnswers: [
          { id: nameField.id, question: nameField.label, type: nameField.type, answer: c.fullName },
          { id: emailField.id, question: emailField.label, type: emailField.type, answer: c.email },
        ],
        resumeUrl: `https://example.com/resumes/${c.id}.pdf`,
        currentStage: PipelineStage.SCREENING,
        score: 80,
      }),
    ),
  )

  console.log('Seed complete.')
  await AppDataSource.destroy()
}

run().catch((err) => {
  console.error('Seed failed', err)
  process.exit(1)
})
