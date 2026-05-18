import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { OfferController } from '../controllers/offer.controller'
import { validate, asyncHandler } from '../middlewares'
import { RespondToOfferSchema, ResendOfferSchema } from '../../core/dtos/offer.dto'

export class OfferRoutes extends BaseRoute {
  public path = '/offers'

  protected initRoutes(): void {
    const c = container.resolve(OfferController)
    this.router.get('/:token', asyncHandler(c.getPublic))
    this.router.post('/:token/respond', validate(RespondToOfferSchema), asyncHandler(c.respond))
    this.router.post('/resend', validate(ResendOfferSchema), asyncHandler(c.resend))
  }
}
