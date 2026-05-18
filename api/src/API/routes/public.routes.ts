import multer from 'multer'
import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { PublicController } from '../controllers/public.controller'
import { asyncHandler } from '../middlewares'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

export class PublicRoutes extends BaseRoute {
  public path = '/public'

  protected initRoutes(): void {
    const c = container.resolve(PublicController)

    this.router.get('/careers/:orgSlug', asyncHandler(c.getCareers))
    this.router.get('/careers/:orgSlug/jobs/:jobId', asyncHandler(c.getJob))
    this.router.get('/careers/:orgSlug/jobs/:jobId/form', asyncHandler(c.getJobForm))
    this.router.post('/careers/:orgSlug/jobs/:jobId/apply', upload.single('resume'), asyncHandler(c.apply))
  }
}
