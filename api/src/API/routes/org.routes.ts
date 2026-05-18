import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { OrgController } from '../controllers/org.controller'
import { DomainController } from '../controllers/domain.controller'
import { MemberController } from '../controllers/member.controller'
import { InviteController } from '../controllers/invite.controller'
import { AccessRequestController } from '../controllers/access-request.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import {
  UpdateOrgSchema,
  UpdateBrandingSchema,
  UpdateScoringSchema,
  UpdateAutoJoinSchema,
} from '../../core/dtos/org.dto'
import { CreateDomainSchema } from '../../core/dtos/domain.dto'
import { UpdateMemberRoleSchema } from '../../core/dtos/member.dto'
import { CreateInviteSchema } from '../../core/dtos/invite.dto'

export class OrgRoutes extends BaseRoute {
  public path = '/orgs/:orgId'

  protected initRoutes(): void {
    const org = container.resolve(OrgController)
    const domain = container.resolve(DomainController)
    const member = container.resolve(MemberController)
    const invite = container.resolve(InviteController)
    const access = container.resolve(AccessRequestController)

    this.router.use(authenticate, requireOrgMember)

    const A = authorizeOrgRole(OrgRole.ADMIN)
    const ARHI = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER, OrgRole.INTERVIEWER)

    this.router.get('/', ARHI, asyncHandler(org.findOne))
    this.router.patch('/', A, validate(UpdateOrgSchema), asyncHandler(org.update))
    this.router.patch('/branding', A, validate(UpdateBrandingSchema), asyncHandler(org.updateBranding))
    this.router.patch('/scoring', A, validate(UpdateScoringSchema), asyncHandler(org.updateScoring))
    this.router.patch('/auto-join', A, validate(UpdateAutoJoinSchema), asyncHandler(org.updateAutoJoin))
    this.router.delete('/', A, asyncHandler(org.delete))

    this.router.get('/domain', A, asyncHandler(domain.find))
    this.router.post('/domain', A, validate(CreateDomainSchema), asyncHandler(domain.create))
    this.router.delete('/domain', A, asyncHandler(domain.delete))
    this.router.post('/domain/verify', A, asyncHandler(domain.verify))

    this.router.get('/members', A, asyncHandler(member.list))
    this.router.patch('/members/:userId/role', A, validate(UpdateMemberRoleSchema), asyncHandler(member.updateRole))
    this.router.delete('/members/:userId', A, asyncHandler(member.remove))

    this.router.get('/invites', A, asyncHandler(invite.list))
    this.router.post('/invites', A, validate(CreateInviteSchema), asyncHandler(invite.create))
    this.router.delete('/invites/:inviteId', A, asyncHandler(invite.revoke))
    this.router.post('/invites/:inviteId/resend', A, asyncHandler(invite.resend))

    this.router.get('/access-requests', A, asyncHandler(access.list))
    this.router.post('/access-requests/:requestId/approve', A, asyncHandler(access.approve))
    this.router.post('/access-requests/:requestId/reject', A, asyncHandler(access.reject))
  }
}
