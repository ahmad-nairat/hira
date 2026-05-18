import { Request, Response, NextFunction } from 'express'

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`)
  })
  next()
}
