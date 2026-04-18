/**
 * Event Publisher Example
 * Demonstrates how to publish events using Redis Pub/Sub
 */

'use server'

import { getPublisher } from '@synergy/platform'

import type { MessageSentPayload, UserStatusChangedPayload } from '@synergy/platform'

/**
 * Example: Publish a chat message sent event
 */
export async function publishMessageSent(
  messageId: string,
  roomId: string,
  userId: string,
  content: string
): Promise<void> {
  const publisher = getPublisher('web')

  const payload: MessageSentPayload = {
    messageId,
    roomId,
    userId,
    content,
    timestamp: new Date().toISOString(),
  }

  await publisher.publishEvent<MessageSentPayload>('chat.message.sent', 'message.sent', payload)

  console.log(`Published message.sent event for message ${messageId}`)
}

/**
 * Example: Publish a user status changed event
 */
export async function publishUserStatusChanged(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
  const publisher = getPublisher('web')

  const payload: UserStatusChangedPayload = {
    userId,
    status,
    timestamp: new Date().toISOString(),
  }

  await publisher.publishEvent<UserStatusChangedPayload>('user.status.changed', 'status.changed', payload)

  console.log(`Published status changed event for user ${userId}: ${status}`)
}

/**
 * Example: Publish a room member joined event
 */
export async function publishRoomMemberJoined(roomId: string, userId: string): Promise<void> {
  const publisher = getPublisher('web')

  await publisher.publishEvent('room.member.joined', 'member.joined', {
    roomId,
    userId,
    timestamp: new Date().toISOString(),
  })

  console.log(`Published member.joined event for room ${roomId}`)
}

/**
 * Example: Batch publish multiple events
 */
export async function publishBatchEvents(
  events: Array<{ channel: string; type: string; payload: unknown }>
): Promise<void> {
  const publisher = getPublisher('web')

  const promises = events.map((event) => publisher.publishEvent(event.channel, event.type, event.payload))

  await Promise.all(promises)

  console.log(`Published ${events.length} events in batch`)
}
