import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { ApplicationController } from '../controllers/application.controller'
import { NoteController } from '../controllers/note.controller'
import { QuestionController } from '../controllers/question.controller'
import { InterviewController } from '../controllers/interview.controller'
import { OfferController } from '../controllers/offer.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { MoveApplicationSchema, RejectApplicationSchema } from '../../core/dtos/application.dto'
import { CreateNoteSchema, UpdateNoteSchema } from '../../core/dtos/note.dto'
import { GenerateQuestionsSchema, UpdateAnswersSchema } from '../../core/dtos/question.dto'
import { CreateInterviewSchema } from '../../core/dtos/interview.dto'
import { CreateOfferSchema, UpdateOfferSchema } from '../../core/dtos/offer.dto'

export class ApplicationRoutes extends BaseRoute {
  public path = '/orgs/:orgId/applications'

  protected initRoutes(): void {
    const app = container.resolve(ApplicationController)
    const note = container.resolve(NoteController)
    const q = container.resolve(QuestionController)
    const interview = container.resolve(InterviewController)
    const offer = container.resolve(OfferController)

    this.router.use(authenticate, requireOrgMember)

    const ARHI = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER, OrgRole.INTERVIEWER)
    const ARH = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER)
    const AR = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER)
    const AH = authorizeOrgRole(OrgRole.ADMIN, OrgRole.HIRING_MANAGER)

    this.router.get('/:applicationId', ARHI, asyncHandler(app.findOne))
    this.router.get('/:applicationId/stage-history', ARH, asyncHandler(app.stageHistory))
    this.router.post('/:applicationId/move', ARH, validate(MoveApplicationSchema), asyncHandler(app.move))
    this.router.post('/:applicationId/reject', ARH, validate(RejectApplicationSchema), asyncHandler(app.reject))
    this.router.post('/:applicationId/approve', AH, asyncHandler(app.approve))
    this.router.post('/:applicationId/hire', AR, asyncHandler(app.hire))

    this.router.get('/:applicationId/notes', ARHI, asyncHandler(note.list))
    this.router.post('/:applicationId/notes', ARH, validate(CreateNoteSchema), asyncHandler(note.create))
    this.router.patch('/:applicationId/notes/:noteId', ARH, validate(UpdateNoteSchema), asyncHandler(note.update))
    this.router.delete('/:applicationId/notes/:noteId', ARH, asyncHandler(note.delete))

    this.router.post('/:applicationId/questions/generate', ARHI, validate(GenerateQuestionsSchema), asyncHandler(q.generate))
    this.router.get('/:applicationId/questions', ARHI, asyncHandler(q.list))
    this.router.patch('/:applicationId/questions/:questionsId/answers', ARHI, validate(UpdateAnswersSchema), asyncHandler(q.updateAnswers))
    this.router.delete('/:applicationId/questions/:questionsId', ARHI, asyncHandler(q.delete))

    this.router.get('/:applicationId/interviews', ARH, asyncHandler(interview.listByApplication))
    this.router.post('/:applicationId/interviews', ARH, validate(CreateInterviewSchema), asyncHandler(interview.create))

    this.router.post('/:applicationId/offer', AR, validate(CreateOfferSchema), asyncHandler(offer.create))
    this.router.patch('/:applicationId/offer', AR, validate(UpdateOfferSchema), asyncHandler(offer.update))
    this.router.post('/:applicationId/offer/send', AR, asyncHandler(offer.send))
  }
}
