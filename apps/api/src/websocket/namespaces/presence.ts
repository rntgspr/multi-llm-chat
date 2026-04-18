import type { Server as SocketIOServer } from 'socket.io'
import type { SocketData } from '../middleware/session.js'
import { logger } from '../../lib/logger.js'

/**
 * User status types
 */
export type UserStatus = 'online' | 'offline' | 'away'

/**
 * Presence namespace event payloads
 */
export interface StatusUpdateEvent {
  status: UserStatus
}

/**
 * Configure /presence namespace for user status updates
 */
export function configurePresenceNamespace(io: SocketIOServer) {
  const presenceNamespace = io.of('/presence')

  presenceNamespace.on('connection', (socket) => {
    const userId = (socket.data as SocketData).userId
    logger.info(
      { socketId: socket.id, userId, namespace: '/presence' },
      'Client connected to /presence namespace',
    )

    // Automatically set user as online
    presenceNamespace.emit('status:changed', {
      userId,
      status: 'online' as UserStatus,
      timestamp: new Date().toISOString(),
    })

    // Handle status:update event
    socket.on('status:update', (event: StatusUpdateEvent) => {
      const { status } = event

      logger.info({ userId, status }, 'User status updated')

      // Broadcast to all connected clients
      presenceNamespace.emit('status:changed', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId, reason, namespace: '/presence' },
        'Client disconnected from /presence namespace',
      )

      // Set user as offline
      presenceNamespace.emit('status:changed', {
        userId,
        status: 'offline' as UserStatus,
        timestamp: new Date().toISOString(),
      })
    })
  })

  logger.info('/presence namespace configured')
  return presenceNamespace
}
