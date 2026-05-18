import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { InterviewController } from '../controllers/interview.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { UpdateInterviewSchema, SubmitFeedbackSchema } from '../../core/dtos/interview.dto'

export class InterviewRoutes extends BaseRoute {
  public path = '/orgs/:orgId/interviews'

  protected initRoutes(): void {
    const c = container.resolve(InterviewController)
    this.router.use(authenticate, requireOrgMember)

    const ARHI = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER, OrgRole.INTERVIEWER)
    const ARH = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER)

    this.router.get('/', ARHI, asyncHandler(c.list))
    this.router.get('/:interviewId', ARHI, asyncHandler(c.findOne))
    this.router.patch('/:interviewId', ARH, validate(UpdateInterviewSchema), asyncHandler(c.update))
    this.router.post('/:interviewId/cancel', ARH, asyncHandler(c.cancel))
    this.router.get('/:interviewId/feedback', ARHI, asyncHandler(c.getFeedback))
    this.router.post('/:interviewId/feedback', ARHI, validate(SubmitFeedbackSchema), asyncHandler(c.submitFeedback))
  }
}
