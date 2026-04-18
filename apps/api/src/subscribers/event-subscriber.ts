/**
 * Redis Event Subscriber → WebSocket Bridge
 * Subscribes to Redis Pub/Sub events and broadcasts them to WebSocket clients
 */

import { CHANNELS, getSubscriber } from '@multi-llm/platform'
import type {
  MessageSentPayload,
  MessageUpdatedPayload,
  MessageDeletedPayload,
  RoomMemberJoinedPayload,
  RoomMemberLeftPayload,
  PubSubEnvelope,
} from '@multi-llm/platform'

import { getSocketServer } from '../websocket/server.js'
import { logger, createCorrelatedLogger } from '../lib/logger.js'

/**
 * Subscribe to chat.message.sent and broadcast to /chat namespace
 */
async function subscribeToMessageSent(): Promise<() => void> {
  const subscriber = getSubscriber()

  const unsubscribe = await subscriber.subscribe<MessageSentPayload>(
    CHANNELS.CHAT.MESSAGE_SENT,
    (message: PubSubEnvelope<MessageSentPayload>) => {
      const { roomId, messageId, userId, content } = message.payload
      const correlationId = message.correlationId || message.messageId

      const log = createCorrelatedLogger(correlationId)
      log.info(
        { roomId, messageId, userId, channel: message.channel },
        'Broadcasting message:new to WebSocket clients',
      )

      try {
        const io = getSocketServer()
        const chatNamespace = io.of('/chat')

        // Broadcast to all clients in the room
        chatNamespace.to(roomId).emit('message:new', {
          messageId,
          roomId,
          userId,
          content,
          timestamp: message.timestamp,
          correlationId,
        })

        log.info({ roomId, messageId }, 'Message broadcasted successfully')
      } catch (error) {
        log.error({ error, roomId, messageId }, 'Failed to broadcast message')
      }
    },
  )

  logger.info('Subscribed to chat.message.sent')
  return unsubscribe
}

/**
 * Subscribe to room.member.joined and broadcast to /chat namespace
 */
async function subscribeToMemberJoined(): Promise<() => void> {
  const subscriber = getSubscriber()

  const unsubscribe = await subscriber.subscribe<RoomMemberJoinedPayload>(
    CHANNELS.ROOM.MEMBER_JOINED,
    (message: PubSubEnvelope<RoomMemberJoinedPayload>) => {
      const { roomId, userId } = message.payload
      const correlationId = message.correlationId || message.messageId

      const log = createCorrelatedLogger(correlationId)
      log.info(
        { roomId, userId, channel: message.channel },
        'Broadcasting member:joined to WebSocket clients',
      )

      try {
        const io = getSocketServer()
        const chatNamespace = io.of('/chat')

        chatNamespace.to(roomId).emit('member:joined', {
          userId,
          roomId,
          timestamp: message.timestamp,
          correlationId,
        })

        log.info({ roomId, userId }, 'Member joined event broadcasted')
      } catch (error) {
        log.error({ error, roomId, userId }, 'Failed to broadcast member:joined')
      }
    },
  )

  logger.info('Subscribed to room.member.joined')
  return unsubscribe
}

/**
 * Subscribe to room.member.left and broadcast to /chat namespace
 */
async function subscribeToMemberLeft(): Promise<() => void> {
  const subscriber = getSubscriber()

  const unsubscribe = await subscriber.subscribe<RoomMemberLeftPayload>(
    CHANNELS.ROOM.MEMBER_LEFT,
    (message: PubSubEnvelope<RoomMemberLeftPayload>) => {
      const { roomId, userId } = message.payload
      const correlationId = message.correlationId || message.messageId

      const log = createCorrelatedLogger(correlationId)
      log.info(
        { roomId, userId, channel: message.channel },
        'Broadcasting member:left to WebSocket clients',
      )

      try {
        const io = getSocketServer()
        const chatNamespace = io.of('/chat')

        chatNamespace.to(roomId).emit('member:left', {
          userId,
          roomId,
          timestamp: message.timestamp,
          correlationId,
        })

        log.info({ roomId, userId }, 'Member left event broadcasted')
      } catch (error) {
        log.error({ error, roomId, userId }, 'Failed to broadcast member:left')
      }
    },
  )

  logger.info('Subscribed to room.member.left')
  return unsubscribe
}

/**
 * Subscribe to all events and bridge to WebSocket
 */
export async function subscribeToAllEvents(): Promise<() => void> {
  logger.info('Starting all event subscribers...')

  const unsubscribes = await Promise.all([
    subscribeToMessageSent(),
    subscribeToMemberJoined(),
    subscribeToMemberLeft(),
  ])

  logger.info('All event subscribers initialized')

  // Return a function that unsubscribes from all channels
  return async () => {
    logger.info('Unsubscribing from all events...')
    for (const unsubscribe of unsubscribes) {
      await unsubscribe()
    }
    logger.info('All event subscribers stopped')
  }
}
