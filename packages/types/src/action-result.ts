/**
 * Error codes for Server Actions
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // External Services
  REDIS_UNAVAILABLE = 'REDIS_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Generic
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Success result from Server Action
 */
export interface ActionSuccess<T = unknown> {
  success: true
  data: T
  correlationId?: string
}

/**
 * Error result from Server Action
 */
export interface ActionError {
  success: false
  error: ErrorCode
  message: string
  details?: Record<string, unknown>
  correlationId?: string
  retryAfter?: number // For rate limiting
}

/**
 * Discriminated union for Server Action results
 */
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionError

/**
 * Helper to create success result
 */
export function actionSuccess<T>(data: T, correlationId?: string): ActionSuccess<T> {
  return { success: true, data, correlationId }
}

/**
 * Helper to create error result
 */
export function actionError(
  error: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  correlationId?: string
): ActionError {
  return { success: false, error, message, details, correlationId }
}
