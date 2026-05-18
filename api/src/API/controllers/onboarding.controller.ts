import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { OnboardingService } from '../../application/services/onboarding.service'
import { OrgService } from '../../application/services/org.service'
import { AccessRequestService } from '../../application/services/access-request.service'
import { InviteService } from '../../application/services/invite.service'
import { UnauthorizedError } from '../../application/errors'

@injectable()
export class OnboardingController {
  constructor(
    @inject(OnboardingService) private readonly onboarding: OnboardingService,
    @inject(OrgService) private readonly orgService: OrgService,
    @inject(AccessRequestService) private readonly accessService: AccessRequestService,
    @inject(InviteService) private readonly inviteService: InviteService,
  ) {}

  check = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    res.json({ data: await this.onboarding.check(req.user.id) })
  }

  createOrg = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const result = await this.orgService.create(req.body, req.user.id)
    res.status(201).json({ data: result })
  }

  requestJoin = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const result = await this.accessService.request(req.user.id)
    res.json({ data: result })
  }

  getInvite = async (req: Request, res: Response): Promise<void> => {
    const result = await this.inviteService.getByToken(String(req.params.token))
    res.json({ data: result })
  }

  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const result = await this.inviteService.accept(String(req.params.token), req.user.id)
    res.json({ data: result })
  }

  declineInvite = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    await this.inviteService.decline(String(req.params.token), req.user.id)
    res.status(204).send()
  }
}
