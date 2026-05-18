import { Request, Response, NextFunction } from 'express'
import { AppError } from '../../application/errors'

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  console.error('[UNHANDLED ERROR]', err)
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
}
