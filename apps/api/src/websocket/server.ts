import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'node:http'
import { sessionValidation } from './middleware/session.js'
import { configureChatNamespace } from './namespaces/chat.js'
import { configurePresenceNamespace } from './namespaces/presence.js'
import { configureTypingNamespace } from './namespaces/typing.js'
import { logger } from '../lib/logger.js'

/**
 * Global Socket.io server instance
 */
let io: SocketIOServer | null = null

/**
 * Initialize Socket.io server
 * @param httpServer - HTTP server instance to attach Socket.io
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    logger.warn('Socket.io server already initialized')
    return io
  }

  const wsOrigin = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: wsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  logger.info({ wsOrigin }, 'Socket.io server initialized')

  // Apply session validation middleware to all namespaces
  io.use(sessionValidation)

  // Configure namespaces with session middleware
  configureChatNamespace(io)
  configurePresenceNamespace(io)
  configureTypingNamespace(io)

  // Default namespace connection event
  io.on('connection', (socket) => {
    const userId = socket.data.userId
    logger.info(
      { socketId: socket.id, userId },
      'Client connected to default namespace',
    )

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId, reason },
        'Client disconnected from default namespace',
      )
    })

    socket.on('error', (error) => {
      logger.error({ socketId: socket.id, userId, error }, 'Socket error')
    })
  })

  return io
}

/**
 * Get the Socket.io server instance
 */
export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error(
      'Socket.io server not initialized. Call initializeSocketServer first.',
    )
  }
  return io
}

/**
 * Shutdown Socket.io server gracefully
 */
export async function shutdownSocketServer(): Promise<void> {
  if (!io) {
    return
  }

  logger.info('Shutting down Socket.io server...')

  // Notify all connected clients
  io.emit('server:shutting-down', {
    message: 'Server is shutting down for maintenance',
  })

  // Close all connections
  io.close()

  io = null
  logger.info('Socket.io server shutdown complete')
}
