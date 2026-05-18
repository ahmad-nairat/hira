import { AppError } from './app.error'

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') {
    super(msg, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') {
    super(msg, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(msg: string) {
    super(msg, 409, 'CONFLICT')
  }
}

export class BusinessRuleError extends AppError {
  constructor(msg: string) {
    super(msg, 422, 'BUSINESS_RULE_VIOLATION')
  }
}

export class InvalidStageTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, 422, 'INVALID_STAGE_TRANSITION')
  }
}

export class GoneError extends AppError {
  constructor(msg = 'This resource is no longer available') {
    super(msg, 410, 'GONE')
  }
}

export class BadRequestError extends AppError {
  constructor(msg: string) {
    super(msg, 400, 'BAD_REQUEST')
  }
}
