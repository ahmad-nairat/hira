import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { CandidateController } from '../controllers/candidate.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import {
  CandidateQuerySchema,
  CreateCandidateSchema,
  UpdateCandidateSchema,
  BlacklistSchema,
  SuggestSchema,
} from '../../core/dtos/candidate.dto'

export class CandidateRoutes extends BaseRoute {
  public path = '/orgs/:orgId/candidates'

  protected initRoutes(): void {
    const c = container.resolve(CandidateController)
    this.router.use(authenticate, requireOrgMember)

    const ARH = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER)
    const AR = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER)

    this.router.get('/', ARH, validate(CandidateQuerySchema, 'query'), asyncHandler(c.findAll))
    this.router.post('/', AR, validate(CreateCandidateSchema), asyncHandler(c.create))
    this.router.get('/:candidateId', ARH, asyncHandler(c.findOne))
    this.router.patch('/:candidateId', AR, validate(UpdateCandidateSchema), asyncHandler(c.update))
    this.router.post('/:candidateId/blacklist', AR, validate(BlacklistSchema), asyncHandler(c.blacklist))
    this.router.delete('/:candidateId/blacklist', AR, asyncHandler(c.unblacklist))
    this.router.post('/:candidateId/suggest', ARH, validate(SuggestSchema), asyncHandler(c.suggest))
  }
}
