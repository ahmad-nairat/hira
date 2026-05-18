import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

type Source = 'body' | 'query' | 'params'

export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        issues: result.error.flatten(),
      })
      return
    }
    if (source === 'body') {
      req.body = result.data
    } else {
      req.validated = req.validated ?? {}
      ;(req.validated as Record<string, unknown>)[source] = result.data
    }
    next()
  }

export function getValidated<S extends ZodSchema>(
  req: Request,
  schema: S,
  source: Exclude<Source, 'body'> = 'query',
): z.infer<S> {
  void schema
  return (req.validated as Record<string, unknown>)?.[source] as z.infer<S>
}
