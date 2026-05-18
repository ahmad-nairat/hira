import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { NotificationController } from '../controllers/notification.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotificationQuerySchema } from '../../core/dtos/notification.dto'

export class NotificationRoutes extends BaseRoute {
  public path = '/orgs/:orgId/notifications'

  protected initRoutes(): void {
    const c = container.resolve(NotificationController)
    this.router.use(authenticate, requireOrgMember)

    const ARHI = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER, OrgRole.INTERVIEWER)

    this.router.get('/', ARHI, validate(NotificationQuerySchema, 'query'), asyncHandler(c.list))
    this.router.get('/stream', ARHI, asyncHandler(c.stream))
    this.router.post('/:notificationId/read', ARHI, asyncHandler(c.markRead))
    this.router.post('/read-all', ARHI, asyncHandler(c.markAllRead))
  }
}
