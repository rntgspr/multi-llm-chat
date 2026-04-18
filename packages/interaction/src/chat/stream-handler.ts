import { messageBus } from './message-bus'
import { createTextContent, messageStore } from './message-store'

import type { AssistantId, MessageId, RoomId } from '@synergy/types'

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

interface ActiveStream {
  messageId: MessageId
  roomId: RoomId
  assistantId: AssistantId
  tokens: string[]
  startedAt: Date
}

/**
 * Handles streaming responses from assistants.
 * Collects tokens and broadcasts them via MessageBus.
 */
export class StreamHandler {
  private activeStreams = new Map<MessageId, ActiveStream>()

  /**
   * Starts a new streaming response
   * @returns The message ID for this stream
   */
  startStream(roomId: RoomId, assistantId: AssistantId): MessageId {
    const messageId = generateId() as MessageId

    const stream: ActiveStream = {
      messageId,
      roomId,
      assistantId,
      tokens: [],
      startedAt: new Date(),
    }

    this.activeStreams.set(messageId, stream)

    // Notify listeners that streaming started
    messageBus.publish({
      type: 'assistant-start',
      roomId,
      assistantId,
      messageId,
    })

    // Block user input while streaming
    messageBus.publish({
      type: 'input-blocked',
      roomId,
      blocked: true,
    })

    return messageId
  }

  /**
   * Pushes a token to an active stream
   */
  pushToken(messageId: MessageId, token: string): void {
    const stream = this.activeStreams.get(messageId)
    if (!stream) {
      console.warn(`[StreamHandler] No active stream for message ${messageId}`)
      return
    }

    stream.tokens.push(token)

    // Broadcast the token
    messageBus.publish({
      type: 'assistant-token',
      roomId: stream.roomId,
      messageId,
      token,
    })
  }

  /**
   * Ends a stream and saves the complete message
   */
  endStream(messageId: MessageId): void {
    const stream = this.activeStreams.get(messageId)
    if (!stream) {
      console.warn(`[StreamHandler] No active stream for message ${messageId}`)
      return
    }

    // Save the complete message
    const fullContent = stream.tokens.join('')
    messageStore.create({
      roomId: stream.roomId,
      senderId: stream.assistantId,
      senderType: 'assistant',
      content: [createTextContent(fullContent)],
      visibility: 'public',
    })

    // Notify listeners that streaming ended
    messageBus.publish({
      type: 'assistant-end',
      roomId: stream.roomId,
      messageId,
    })

    // Unblock user input
    messageBus.publish({
      type: 'input-blocked',
      roomId: stream.roomId,
      blocked: false,
    })

    this.activeStreams.delete(messageId)
  }

  /**
   * Handles stream error
   */
  errorStream(messageId: MessageId, error: string): void {
    const stream = this.activeStreams.get(messageId)
    if (!stream) {
      return
    }

    messageBus.publish({
      type: 'assistant-error',
      roomId: stream.roomId,
      messageId,
      error,
    })

    // Unblock user input
    messageBus.publish({
      type: 'input-blocked',
      roomId: stream.roomId,
      blocked: false,
    })

    this.activeStreams.delete(messageId)
  }

  /**
   * Gets an active stream
   */
  getStream(messageId: MessageId): ActiveStream | undefined {
    return this.activeStreams.get(messageId)
  }

  /**
   * Gets all active streams for a room
   */
  getStreamsByRoom(roomId: RoomId): ActiveStream[] {
    return Array.from(this.activeStreams.values()).filter((s) => s.roomId === roomId)
  }

  /**
   * Checks if a room has active streams
   */
  isStreaming(roomId: RoomId): boolean {
    return this.getStreamsByRoom(roomId).length > 0
  }
}

// Singleton instance
export const streamHandler = new StreamHandler()
