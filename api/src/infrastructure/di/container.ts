import 'reflect-metadata'
import { container } from 'tsyringe'

import { TOKENS } from './tokens'

import { UserRepo } from '../repos/user.repo'
import { OrgRepo } from '../repos/org.repo'
import { OrgDomainRepo } from '../repos/org-domain.repo'
import { OrgMembershipRepo } from '../repos/org-membership.repo'
import { InviteRepo } from '../repos/invite.repo'
import { AccessRequestRepo } from '../repos/access-request.repo'
import { JobRepo } from '../repos/job.repo'
import { JobFormRepo } from '../repos/job-form.repo'
import { CandidateRepo } from '../repos/candidate.repo'
import { BlacklistRepo } from '../repos/blacklist.repo'
import { ApplicationRepo } from '../repos/application.repo'
import { ApplicationStageHistoryRepo } from '../repos/application-stage-history.repo'
import { InterviewRepo } from '../repos/interview.repo'
import { InterviewFeedbackRepo } from '../repos/interview-feedback.repo'
import { GeneratedQuestionsRepo } from '../repos/generated-questions.repo'
import { NoteRepo } from '../repos/note.repo'
import { OfferRepo } from '../repos/offer.repo'
import { NotificationRepo } from '../repos/notification.repo'
import { JobAnalysisRepo } from '../repos/job-analysis.repo'

import { RedisQueueService } from '../services/queue.service'
import { R2FileService } from '../services/file.service'
import { LocalFileService } from '../services/local-file.service'
import { NodemailerMailService } from '../services/mail.service'
import { SseService } from '../services/sse.service'

container.register(TOKENS.IUserRepo, { useClass: UserRepo })
container.register(TOKENS.IOrgRepo, { useClass: OrgRepo })
container.register(TOKENS.IOrgDomainRepo, { useClass: OrgDomainRepo })
container.register(TOKENS.IOrgMembershipRepo, { useClass: OrgMembershipRepo })
container.register(TOKENS.IInviteRepo, { useClass: InviteRepo })
container.register(TOKENS.IAccessRequestRepo, { useClass: AccessRequestRepo })
container.register(TOKENS.IJobRepo, { useClass: JobRepo })
container.register(TOKENS.IJobFormRepo, { useClass: JobFormRepo })
container.register(TOKENS.ICandidateRepo, { useClass: CandidateRepo })
container.register(TOKENS.IBlacklistRepo, { useClass: BlacklistRepo })
container.register(TOKENS.IApplicationRepo, { useClass: ApplicationRepo })
container.register(TOKENS.IApplicationStageHistoryRepo, { useClass: ApplicationStageHistoryRepo })
container.register(TOKENS.IInterviewRepo, { useClass: InterviewRepo })
container.register(TOKENS.IInterviewFeedbackRepo, { useClass: InterviewFeedbackRepo })
container.register(TOKENS.IGeneratedQuestionsRepo, { useClass: GeneratedQuestionsRepo })
container.register(TOKENS.INoteRepo, { useClass: NoteRepo })
container.register(TOKENS.IOfferRepo, { useClass: OfferRepo })
container.register(TOKENS.INotificationRepo, { useClass: NotificationRepo })
container.register(TOKENS.IJobAnalysisRepo, { useClass: JobAnalysisRepo })

container.registerSingleton(TOKENS.IQueueService, RedisQueueService)
container.registerSingleton(
  TOKENS.IFileService,
  process.env.FILE_STORAGE === 'r2' ? R2FileService : LocalFileService,
)
container.registerSingleton(TOKENS.IMailService, NodemailerMailService)
container.registerSingleton(TOKENS.ISseService, SseService)

export { container }
