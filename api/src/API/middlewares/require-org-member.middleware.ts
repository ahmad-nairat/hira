import { container } from '../../infrastructure/di/container'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOrgMembershipRepo } from '../../core/repo-interfaces/IOrgMembershipRepo'
import { UnauthorizedError, ForbiddenError } from '../../application/errors'
import { asyncHandler } from './async-handler'

export const requireOrgMember = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw new UnauthorizedError()
  const orgId = req.params.orgId as string
  if (!orgId) throw new ForbiddenError('Missing org context')

  const membershipRepo = container.resolve<IOrgMembershipRepo>(TOKENS.IOrgMembershipRepo)
  const membership = await membershipRepo.findByUserAndOrg(req.user.id, orgId)
  if (!membership) throw new ForbiddenError('Not a member of this organisation')

  req.membership = { userId: req.user.id, orgId: membership.orgId, role: membership.role }
  next()
})
