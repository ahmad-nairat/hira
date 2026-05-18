import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { JobController } from '../controllers/job.controller'
import { JobFormController } from '../controllers/job-form.controller'
import { ApplicationController } from '../controllers/application.controller'
import { authenticate, requireOrgMember, authorizeOrgRole, validate, asyncHandler } from '../middlewares'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { JobQuerySchema, CreateJobSchema, UpdateJobSchema } from '../../core/dtos/job.dto'
import { JobFormSchema } from '../../core/dtos/job-form.dto'
import { ApplicationQuerySchema } from '../../core/dtos/application.dto'

export class JobRoutes extends BaseRoute {
  public path = '/orgs/:orgId/jobs'

  protected initRoutes(): void {
    const job = container.resolve(JobController)
    const form = container.resolve(JobFormController)
    const app = container.resolve(ApplicationController)

    this.router.use(authenticate, requireOrgMember)

    const AR = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER)
    const ARH = authorizeOrgRole(OrgRole.ADMIN, OrgRole.RECRUITER, OrgRole.HIRING_MANAGER)

    this.router.get('/', ARH, validate(JobQuerySchema, 'query'), asyncHandler(job.findAll))
    this.router.post('/', AR, validate(CreateJobSchema), asyncHandler(job.create))
    this.router.get('/:jobId', ARH, asyncHandler(job.findOne))
    this.router.patch('/:jobId', AR, validate(UpdateJobSchema), asyncHandler(job.update))
    this.router.post('/:jobId/publish', AR, asyncHandler(job.publish))
    this.router.post('/:jobId/close', AR, asyncHandler(job.close))
    this.router.post('/:jobId/archive', AR, asyncHandler(job.archive))
    this.router.post('/:jobId/rescore', AR, asyncHandler(job.rescore))
    this.router.post('/:jobId/reevaluate-rejections', AR, asyncHandler(job.reevaluateRejections))

    this.router.get('/:jobId/form', ARH, asyncHandler(form.findOne))
    this.router.put('/:jobId/form', AR, validate(JobFormSchema), asyncHandler(form.save))

    this.router.get('/:jobId/applications', ARH, validate(ApplicationQuerySchema, 'query'), asyncHandler(app.findByJob))
    this.router.post('/:jobId/applications', AR, asyncHandler(app.createManual))
  }
}
