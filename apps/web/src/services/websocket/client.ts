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

/**
 * Initializes WebSocket connection
 */
export function connect(userId: UserId): Socket {
  if (socket?.connected) {
    return socket
  }

  socket = io({
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('[WS Client] Connected')
    socket?.emit('authenticate', userId)
  })

  socket.on('disconnect', () => {
    console.log('[WS Client] Disconnected')
  })

  socket.on('connect_error', (error) => {
    console.error('[WS Client] Connection error:', error)
  })

  return socket
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
