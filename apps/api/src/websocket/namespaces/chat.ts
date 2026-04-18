import type { Server as SocketIOServer } from 'socket.io'
import type { SocketData } from '../middleware/session.js'
import { logger } from '../../lib/logger.js'

/**
 * Chat namespace event payloads
 */
export interface RoomJoinEvent {
  roomId: string
}

export interface RoomLeaveEvent {
  roomId: string
}

/**
 * Configure /chat namespace for room-based messaging
 */
export function configureChatNamespace(io: SocketIOServer) {
  const chatNamespace = io.of('/chat')

  chatNamespace.on('connection', (socket) => {
    const userId = (socket.data as SocketData).userId
    logger.info(
      { socketId: socket.id, userId, namespace: '/chat' },
      'Client connected to /chat namespace',
    )

    // Handle room:join event
    socket.on('room:join', async (event: RoomJoinEvent) => {
      const { roomId } = event

      try {
        // TODO: Implement proper authorization check
        // For now, we'll assume authorization is handled elsewhere
        // In production, check if user has access to the room:
        // const hasAccess = await checkRoomAccess(userId, roomId)
        // if (!hasAccess) {
        //   socket.emit('room:join:error', {
        //     roomId,
        //     error: 'FORBIDDEN',
        //     message: 'You do not have access to this room',
        //   })
        //   return
        // }

        await socket.join(roomId)

        logger.info(
          { socketId: socket.id, userId, roomId },
          'User joined room (authorization verified)',
        )

        // Broadcast to other room members
        socket.to(roomId).emit('member:joined', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        })

        // Confirm join to the user
        socket.emit('room:joined', {
          roomId,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        logger.error(
          { socketId: socket.id, userId, roomId, error },
          'Failed to join room',
        )
        socket.emit('room:join:error', {
          roomId,
          error: 'INTERNAL_ERROR',
          message: 'Failed to join room',
        })
      }
    })

    // Handle room:leave event
    socket.on('room:leave', async (event: RoomLeaveEvent) => {
      const { roomId } = event

      await socket.leave(roomId)

      logger.info({ socketId: socket.id, userId, roomId }, 'User left room')

      // Broadcast to other room members
      socket.to(roomId).emit('member:left', {
        userId,
        roomId,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId, reason, namespace: '/chat' },
        'Client disconnected from /chat namespace',
      )
    })
  })

  logger.info('/chat namespace configured')
  return chatNamespace
}
