import { randomUUID } from 'node:crypto'

import type { Context, Next } from 'hono'

/**
 * Correlation ID key for Hono context
 */
export const CORRELATION_ID_KEY = 'correlationId'

/**
 * HTTP header for correlation ID
 */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID'

/**
 * Hono middleware to attach correlation ID to requests
 * Extracts from header or generates new UUID
 */
export async function correlationId(c: Context, next: Next) {
  const id = c.req.header(CORRELATION_ID_HEADER) || c.req.header('x-request-id') || randomUUID()

  c.set(CORRELATION_ID_KEY, id)
  c.header(CORRELATION_ID_HEADER, id)

  await next()
}

/**
 * Get correlation ID from Hono context
 */
export function getCorrelationId(c: Context): string {
  return c.get(CORRELATION_ID_KEY) || randomUUID()
}

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return randomUUID()
}
