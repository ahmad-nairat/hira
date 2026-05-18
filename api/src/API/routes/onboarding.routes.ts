import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { OnboardingController } from '../controllers/onboarding.controller'
import { authenticate, validate, asyncHandler } from '../middlewares'
import { CreateOrgSchema } from '../../core/dtos/org.dto'

export class OnboardingRoutes extends BaseRoute {
  public path = '/onboarding'

  protected initRoutes(): void {
    const c = container.resolve(OnboardingController)
    this.router.use(authenticate)

    this.router.get('/check', asyncHandler(c.check))
    this.router.post('/orgs', validate(CreateOrgSchema), asyncHandler(c.createOrg))
    this.router.post('/request-join', asyncHandler(c.requestJoin))
    this.router.get('/invites/:token', asyncHandler(c.getInvite))
    this.router.post('/invites/:token/accept', asyncHandler(c.acceptInvite))
    this.router.post('/invites/:token/decline', asyncHandler(c.declineInvite))
  }
}
