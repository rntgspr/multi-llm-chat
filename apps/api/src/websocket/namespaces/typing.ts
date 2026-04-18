import { logger } from '../../lib/logger.js'

import type { Server as SocketIOServer } from 'socket.io'
import type { SocketData } from '../middleware/session.js'

/**
 * Typing namespace event payloads
 */
export interface TypingStartEvent {
  roomId: string
}

export interface TypingStopEvent {
  roomId: string
}

/**
 * Configure /typing namespace for typing indicators
 */
export function configureTypingNamespace(io: SocketIOServer) {
  const typingNamespace = io.of('/typing')

  typingNamespace.on('connection', (socket) => {
    const userId = (socket.data as SocketData).userId
    logger.info({ socketId: socket.id, userId, namespace: '/typing' }, 'Client connected to /typing namespace')

    // Handle typing:start event
    socket.on('typing:start', (event: TypingStartEvent) => {
      const { roomId } = event

      logger.debug({ userId, roomId }, 'User started typing')

      // Broadcast to room members (except sender)
      socket.to(roomId).emit('typing:indicator', {
        userId,
        roomId,
        isTyping: true,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle typing:stop event
    socket.on('typing:stop', (event: TypingStopEvent) => {
      const { roomId } = event

      logger.debug({ userId, roomId }, 'User stopped typing')

      // Broadcast to room members (except sender)
      socket.to(roomId).emit('typing:indicator', {
        userId,
        roomId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId, reason, namespace: '/typing' },
        'Client disconnected from /typing namespace'
      )
    })
  })

  logger.info('/typing namespace configured')
  return typingNamespace
}
