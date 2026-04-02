import type { Socket, Server as SocketIOServer } from 'socket.io'
import type { JoinRoomEvent, LeaveRoomEvent, Message, NewMessageEvent, RoomId, TypingEvent, UserId } from '@/types'

// Connection map: socketId -> userId
const connections = new Map<string, UserId>()

// Room connections map: roomId -> Set<socketId>
const roomConnections = new Map<RoomId, Set<string>>()

/**
 * Configures WebSocket handlers
 */
export function configureWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] New connection: ${socket.id}`)

    // Authenticate user
    socket.on('authenticate', (userId: UserId) => {
      connections.set(socket.id, userId)
      console.log(`[WS] User authenticated: ${userId}`)
    })

    // Join a room
    socket.on('join-room', ({ roomId, userId }: JoinRoomEvent) => {
      socket.join(roomId)

      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set())
      }
      roomConnections.get(roomId)?.add(socket.id)

      // Notify other participants
      socket.to(roomId).emit('user-joined', { userId, roomId })
      console.log(`[WS] User ${userId} joined room ${roomId}`)
    })

    // Leave a room
    socket.on('leave-room', ({ roomId, userId }: LeaveRoomEvent) => {
      socket.leave(roomId)
      roomConnections.get(roomId)?.delete(socket.id)

      // Notify other participants
      socket.to(roomId).emit('user-left', { userId, roomId })
      console.log(`[WS] User ${userId} left room ${roomId}`)
    })

    // Send message
    socket.on('send-message', (message: Message) => {
      const { roomId, visibility } = message

      // Hidden messages go only to orchestrator
      if (visibility === 'public') {
        io.to(roomId).emit('new-message', { message } as NewMessageEvent)
      }

      // TODO: Send to orchestrator for processing
      console.log(`[WS] Message in room ${roomId}: ${JSON.stringify(message.content)}`)
    })

    // Typing indicator
    socket.on('typing', (event: TypingEvent) => {
      socket.to(event.roomId).emit('user-typing', event)
    })

    // Disconnection
    socket.on('disconnect', () => {
      const userId = connections.get(socket.id)

      // Remove from all rooms
      roomConnections.forEach((socketIds, roomId) => {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id)
          if (userId) {
            io.to(roomId).emit('user-left', { userId, roomId })
          }
        }
      })

      connections.delete(socket.id)
      console.log(`[WS] Disconnected: ${socket.id}`)
    })
  })
}

/**
 * Sends message to a specific room
 */
export function sendToRoom(io: SocketIOServer, roomId: RoomId, event: string, data: unknown): void {
  io.to(roomId).emit(event, data)
}

/**
 * Gets connected users in a room
 */
export function getRoomUsers(roomId: RoomId): UserId[] {
  const socketIds = roomConnections.get(roomId)
  if (!socketIds) return []

  return Array.from(socketIds)
    .map((socketId) => connections.get(socketId))
    .filter((id): id is UserId => id !== undefined)
}
