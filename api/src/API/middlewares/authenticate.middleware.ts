import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../../application/errors'

interface AccessPayload {
  sub: string
  email: string
}

/**
 * Reads the access token from the Authorization header OR from the `?token=` query string.
 * The query-string path is only used by EventSource (SSE), which cannot send custom headers.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  let token: string | undefined
  if (header?.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length).trim()
  } else if (typeof req.query.token === 'string' && req.query.token.length > 0) {
    token = req.query.token
  }
  if (!token) throw new UnauthorizedError('Missing access token')
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessPayload
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired access token')
  }
}
