import type {
  AssistantId,
  Message,
  MessageContent,
  MessageId,
  MessageVisibility,
  RoomId,
  SenderType,
  UserId,
} from '@multi-llm/types'

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

interface CreateMessageParams {
  roomId: RoomId
  senderId: UserId | AssistantId
  senderType: SenderType
  content: MessageContent[]
  visibility?: MessageVisibility
  recipientId?: AssistantId
}

interface GetMessagesOptions {
  limit?: number
  since?: Date
  publicOnly?: boolean
}

/**
 * In-memory message storage.
 * TODO: Replace with database integration via @multi-llm/db
 */
export class MessageStore {
  private messagesByRoom = new Map<RoomId, Message[]>()

  /**
   * Creates a new message
   */
  create(params: CreateMessageParams): Message {
    const message: Message = {
      id: generateId() as MessageId,
      roomId: params.roomId,
      senderId: params.senderId,
      senderType: params.senderType,
      content: params.content,
      visibility: params.visibility ?? 'public',
      recipientId: params.recipientId,
      createdAt: new Date(),
    }

    if (!this.messagesByRoom.has(params.roomId)) {
      this.messagesByRoom.set(params.roomId, [])
    }

    this.messagesByRoom.get(params.roomId)!.push(message)
    return message
  }

  /**
   * Gets messages from a room
   */
  getByRoom(roomId: RoomId, options?: GetMessagesOptions): Message[] {
    let messages = this.messagesByRoom.get(roomId) || []

    if (options?.publicOnly) {
      messages = messages.filter((m) => m.visibility === 'public')
    }

    if (options?.since) {
      messages = messages.filter((m) => m.createdAt >= options.since!)
    }

    if (options?.limit && messages.length > options.limit) {
      messages = messages.slice(-options.limit)
    }

    return messages
  }

  /**
   * Gets a specific message by ID
   */
  getById(roomId: RoomId, messageId: MessageId): Message | undefined {
    const messages = this.messagesByRoom.get(roomId) || []
    return messages.find((m) => m.id === messageId)
  }

  /**
   * Gets hidden messages for a specific assistant
   */
  getHiddenForAssistant(roomId: RoomId, assistantId: AssistantId): Message[] {
    const messages = this.messagesByRoom.get(roomId) || []
    return messages.filter((m) => m.visibility === 'hidden' && (m.recipientId === assistantId || !m.recipientId))
  }

  /**
   * Counts messages in a room
   */
  count(roomId: RoomId, publicOnly = false): number {
    const messages = this.messagesByRoom.get(roomId) || []
    if (publicOnly) {
      return messages.filter((m) => m.visibility === 'public').length
    }
    return messages.length
  }

  /**
   * Clears messages from a room
   */
  clearRoom(roomId: RoomId): void {
    this.messagesByRoom.delete(roomId)
  }

  /**
   * Clears all messages
   */
  clearAll(): void {
    this.messagesByRoom.clear()
  }
}

// Singleton instance
export const messageStore = new MessageStore()

// =============================================================================
// CONTENT HELPERS
// =============================================================================

export function createTextContent(text: string): MessageContent {
  return { type: 'text', text }
}

export function createImageContent(url: string, altText?: string, width?: number, height?: number): MessageContent {
  return { type: 'image', url, altText, width, height }
}

export function createFileContent(url: string, fileName: string, sizeBytes: number, mimeType: string): MessageContent {
  return { type: 'file', url, fileName, sizeBytes, mimeType }
}
