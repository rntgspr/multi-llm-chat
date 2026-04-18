import { logger } from '../../lib/logger.js'
import { extractTokenFromSocket, verifyJWT } from '../../middlewares/auth.js'

import type { Socket } from 'socket.io'

/**
 * Extended socket data with session information
 */
export interface SocketData {
  userId: string
  sessionId: string
  email?: string
  name?: string
}

/**
 * WebSocket session validation middleware
 * Verifies JWT token and attaches user data to socket
 */
export async function sessionValidation(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = extractTokenFromSocket(socket.handshake)

    if (!token) {
      logger.warn({ socketId: socket.id }, 'Connection rejected: No authentication token provided')
      return next(new Error('Authentication token required'))
    }

    // TODO: Remove this dev bypass after NextAuth JWT is properly configured
    // For now, accept temp tokens during development
    if (token.startsWith('temp-token-')) {
      const userId = token.replace('temp-token-', '')
      socket.data.userId = userId
      socket.data.sessionId = `session-${userId}`
      logger.info({ socketId: socket.id, userId }, 'WebSocket authenticated (dev mode)')
      return next()
    }

    const payload = await verifyJWT(token)

    if (!payload || !payload.sub) {
      logger.warn({ socketId: socket.id }, 'Connection rejected: Invalid or expired token')
      return next(new Error('Invalid token'))
    }

    // Attach user data to socket
    socket.data.userId = payload.sub
    socket.data.sessionId = payload.jti || payload.sub
    socket.data.email = payload.email
    socket.data.name = payload.name

    logger.info({ socketId: socket.id, userId: payload.sub }, 'WebSocket session validated')

    next()
  } catch (error) {
    logger.error({ error, socketId: socket.id }, 'Session validation error')
    next(new Error('Authentication failed'))
  }
}
