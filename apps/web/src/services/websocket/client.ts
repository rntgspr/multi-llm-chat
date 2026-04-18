'use client'

import { io, type Socket } from 'socket.io-client'

import type {
  JoinRoomEvent,
  LeaveRoomEvent,
  Message,
  NewMessageEvent,
  RoomId,
  TypingEvent,
  UserId,
} from '@multi-llm/types'

let socket: Socket | null = null
let connectionStatus: 'connected' | 'disconnected' | 'reconnecting' =
  'disconnected'
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Get JWT token from session
 * For now, use a placeholder until NextAuth JWT is properly configured
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    // TODO: Configure NextAuth to include JWT token in session
    // For now, return user.id as a temporary token if user exists
    if (session?.user?.id) {
      return `temp-token-${session.user.id}`
    }
    
    return null
  } catch (error) {
    console.error('[WS Client] Failed to get session token:', error)
    return null
  }
}

/**
 * Initializes WebSocket connection to apps/api
 * @param userId - User ID (deprecated, use token instead)
 */
export async function connect(userId: UserId): Promise<Socket> {
  if (socket?.connected) {
    return socket
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'
  const token = await getSessionToken()

  if (!token) {
    console.warn('[WS Client] No session token available, connection may fail')
  }

  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    auth: {
      token,
    },
  })

  socket.on('connect', () => {
    console.log('[WS Client] Connected to apps/api')
    connectionStatus = 'connected'
    reconnectAttempts = 0
  })

  socket.on('disconnect', (reason) => {
    console.log('[WS Client] Disconnected:', reason)
    connectionStatus = 'disconnected'

    // If server initiated disconnect, may need to refresh token
    if (reason === 'io server disconnect') {
      console.log('[WS Client] Server disconnected, may need token refresh')
    }
  })

  socket.on('connect_error', (error) => {
    console.error('[WS Client] Connection error:', error.message)
    connectionStatus = 'disconnected'

    // Handle authentication errors
    if (error.message === 'Invalid token' || error.message === 'Authentication token required') {
      console.error('[WS Client] Authentication failed, token may be invalid or expired')
    }
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log(`[WS Client] Reconnected after ${attemptNumber} attempts`)
    connectionStatus = 'connected'
    reconnectAttempts = 0
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`[WS Client] Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`)
    connectionStatus = 'reconnecting'
    reconnectAttempts = attemptNumber
  })

  socket.on('reconnect_error', (error) => {
    console.error('[WS Client] Reconnection error:', error.message)
  })

  socket.on('reconnect_failed', () => {
    console.error('[WS Client] Reconnection failed after max attempts')
    connectionStatus = 'disconnected'
  })

  return socket
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
  return connectionStatus
}

/**
 * Get reconnection attempts count
 */
export function getReconnectAttempts(): number {
  return reconnectAttempts
}

/**
 * Disconnects from WebSocket
 */
export function disconnect(): void {
  socket?.disconnect()
  socket = null
}

/**
 * Gets current socket instance
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Joins a room
 */
export function joinRoom(roomId: RoomId, userId: UserId): void {
  socket?.emit('join-room', { roomId, userId } as JoinRoomEvent)
}

/**
 * Leaves a room
 */
export function leaveRoom(roomId: RoomId, userId: UserId): void {
  socket?.emit('leave-room', { roomId, userId } as LeaveRoomEvent)
}

/**
 * Sends a message
 */
export function sendMessage(message: Message): void {
  socket?.emit('send-message', message)
}

/**
 * Indicates user is typing
 */
export function setTyping(roomId: RoomId, senderId: UserId, isTyping: boolean): void {
  socket?.emit('typing', {
    roomId,
    senderId,
    senderType: 'user',
    isTyping,
  } as TypingEvent)
}

// =============================================================================
// LISTENERS
// =============================================================================

type NewMessageCallback = (event: NewMessageEvent) => void
type UserJoinedCallback = (data: { userId: UserId; roomId: RoomId }) => void
type UserLeftCallback = (data: { userId: UserId; roomId: RoomId }) => void
type TypingCallback = (event: TypingEvent) => void

/**
 * Registers listener for new messages
 */
export function onMessage(callback: NewMessageCallback): () => void {
  socket?.on('new-message', callback)
  return () => socket?.off('new-message', callback)
}

/**
 * Registers listener for user joining
 */
export function onUserJoined(callback: UserJoinedCallback): () => void {
  socket?.on('user-joined', callback)
  return () => socket?.off('user-joined', callback)
}

/**
 * Registers listener for user leaving
 */
export function onUserLeft(callback: UserLeftCallback): () => void {
  socket?.on('user-left', callback)
  return () => socket?.off('user-left', callback)
}

/**
 * Registers listener for typing indicator
 */
export function onTyping(callback: TypingCallback): () => void {
  socket?.on('user-typing', callback)
  return () => socket?.off('user-typing', callback)
}
