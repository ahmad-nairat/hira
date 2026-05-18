import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

import { User } from '../../core/entities/user.entity'
import { Org } from '../../core/entities/org.entity'
import { OrgDomain } from '../../core/entities/org-domain.entity'
import { OrgMembership } from '../../core/entities/org-membership.entity'
import { Invite } from '../../core/entities/invite.entity'
import { AccessRequest } from '../../core/entities/access-request.entity'
import { Job } from '../../core/entities/job.entity'
import { JobForm } from '../../core/entities/job-form.entity'
import { JobFormSection } from '../../core/entities/job-form-section.entity'
import { JobFormField } from '../../core/entities/job-form-field.entity'
import { Candidate } from '../../core/entities/candidate.entity'
import { BlacklistEntry } from '../../core/entities/blacklist-entry.entity'
import { Application } from '../../core/entities/application.entity'
import { ApplicationStageHistory } from '../../core/entities/application-stage-history.entity'
import { Interview } from '../../core/entities/interview.entity'
import { InterviewFeedback } from '../../core/entities/interview-feedback.entity'
import { GeneratedQuestions } from '../../core/entities/generated-questions.entity'
import { Note } from '../../core/entities/note.entity'
import { Offer } from '../../core/entities/offer.entity'
import { Notification } from '../../core/entities/notification.entity'
import { JobAnalysis } from '../../core/entities/job-analysis.entity'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false,
  entities: [
    User,
    Org,
    OrgDomain,
    OrgMembership,
    Invite,
    AccessRequest,
    Job,
    JobForm,
    JobFormSection,
    JobFormField,
    Candidate,
    BlacklistEntry,
    Application,
    ApplicationStageHistory,
    Interview,
    InterviewFeedback,
    GeneratedQuestions,
    Note,
    Offer,
    Notification,
    JobAnalysis,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsRun: false,
})
