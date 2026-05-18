import { Request, Response, NextFunction } from 'express'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { UnauthorizedError, ForbiddenError } from '../../application/errors'

export const authorizeOrgRole =
  (...roles: OrgRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.membership) throw new UnauthorizedError()
    if (!roles.includes(req.membership.role)) throw new ForbiddenError('Insufficient permissions')
    next()
  }
