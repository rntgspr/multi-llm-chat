import pino from 'pino'

/**
 * Structured logger using pino
 * Provides consistent logging across apps/api
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    service: 'api',
  },
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
})

/**
 * Create a child logger with correlation ID
 */
export function createCorrelatedLogger(correlationId: string) {
  return logger.child({ correlationId })
}

/**
 * Create a child logger with additional context
 */
export function createContextLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
