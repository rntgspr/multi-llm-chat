import { messageRepository } from '@multi-llm/db/repositories'

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
  page?: number
  since?: Date
  publicOnly?: boolean
}

/**
 * Message storage with SurrealDB persistence
 */
export class MessageStore {
  /**
   * Creates a new message
   */
  async create(params: CreateMessageParams): Promise<Message> {
    try {
      const contentString = JSON.stringify(params.content)

      const dbMessage = await messageRepository.create({
        roomId: params.roomId,
        userId: params.senderId,
        content: contentString,
        isHidden: params.visibility === 'hidden',
        metadata: {
          senderType: params.senderType,
          recipientId: params.recipientId,
        },
      })

      return {
        id: dbMessage.id as MessageId,
        roomId: dbMessage.roomId as RoomId,
        senderId: params.senderId,
        senderType: params.senderType,
        content: params.content,
        visibility: params.visibility ?? 'public',
        recipientId: params.recipientId,
        createdAt: dbMessage.timestamp,
      }
    } catch (error) {
      console.error('[MessageStore] Failed to create message:', error)
      throw error
    }
  }

  /**
   * Gets messages from a room
   */
  async getByRoom(roomId: RoomId, options?: GetMessagesOptions): Promise<Message[]> {
    try {
      const page = options?.page ?? 1
      const limit = options?.limit ?? 50
      const offset = (page - 1) * limit

      const dbMessages = await messageRepository.findByRoom(roomId, limit, offset)

      const messages: Message[] = dbMessages.map((dbMsg) => {
        const metadata = (dbMsg.metadata || {}) as {
          senderType?: SenderType
          recipientId?: AssistantId
        }

        let content: MessageContent[]
        try {
          content = JSON.parse(dbMsg.content)
        } catch {
          content = [{ type: 'text', text: dbMsg.content }]
        }

        return {
          id: dbMsg.id as MessageId,
          roomId: dbMsg.roomId as RoomId,
          senderId: dbMsg.userId,
          senderType: metadata.senderType || 'user',
          content,
          visibility: dbMsg.isHidden ? 'hidden' : 'public',
          recipientId: metadata.recipientId,
          createdAt: dbMsg.timestamp,
        }
      })

      let filtered = messages

      if (options?.publicOnly) {
        filtered = filtered.filter((m) => m.visibility === 'public')
      }

      if (options?.since) {
        filtered = filtered.filter((m) => m.createdAt >= options.since!)
      }

      return filtered
    } catch (error) {
      console.error('[MessageStore] Failed to get messages:', error)
      return []
    }
  }

  /**
   * Gets a specific message by ID
   */
  async getById(roomId: RoomId, messageId: MessageId): Promise<Message | undefined> {
    try {
      const dbMessage = await messageRepository.findById(messageId)
      if (!dbMessage || dbMessage.roomId !== roomId) return undefined

      const metadata = (dbMessage.metadata || {}) as {
        senderType?: SenderType
        recipientId?: AssistantId
      }

      let content: MessageContent[]
      try {
        content = JSON.parse(dbMessage.content)
      } catch {
        content = [{ type: 'text', text: dbMessage.content }]
      }

      return {
        id: dbMessage.id as MessageId,
        roomId: dbMessage.roomId as RoomId,
        senderId: dbMessage.userId,
        senderType: metadata.senderType || 'user',
        content,
        visibility: dbMessage.isHidden ? 'hidden' : 'public',
        recipientId: metadata.recipientId,
        createdAt: dbMessage.timestamp,
      }
    } catch (error) {
      console.error('[MessageStore] Failed to get message by id:', error)
      return undefined
    }
  }

  /**
   * Gets hidden messages for a specific assistant
   */
  async getHiddenForAssistant(roomId: RoomId, assistantId: AssistantId): Promise<Message[]> {
    try {
      const allMessages = await this.getByRoom(roomId, { limit: 1000 })
      return allMessages.filter((m) => m.visibility === 'hidden' && (m.recipientId === assistantId || !m.recipientId))
    } catch (error) {
      console.error('[MessageStore] Failed to get hidden messages:', error)
      return []
    }
  }

  /**
   * Counts messages in a room
   */
  async count(roomId: RoomId, publicOnly = false): Promise<number> {
    try {
      const total = await messageRepository.countByRoom(roomId)
      if (!publicOnly) return total

      // For publicOnly, we need to fetch and count
      const messages = await this.getByRoom(roomId, { limit: 10000, publicOnly: true })
      return messages.length
    } catch (error) {
      console.error('[MessageStore] Failed to count messages:', error)
      return 0
    }
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
