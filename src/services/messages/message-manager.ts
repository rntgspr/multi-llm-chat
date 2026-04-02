import type {
  Message,
  MessageId,
  RoomId,
  UserId,
  AssistantId,
  SenderType,
  MessageVisibility,
  MessageContent,
} from '@/types'
import { generateId } from '@/lib/utils'

// =============================================================================
// IN-MEMORY STORAGE
// =============================================================================

const messagesByRoom = new Map<RoomId, Message[]>()

// =============================================================================
// FUNCTIONS
// =============================================================================

interface CreateMessageParams {
  roomId: RoomId
  senderId: UserId | AssistantId
  senderType: SenderType
  content: MessageContent[]
  visibility?: MessageVisibility
  recipientId?: AssistantId
}

/**
 * Creates a new message
 */
export function createMessage({
  roomId,
  senderId,
  senderType,
  content,
  visibility = 'public',
  recipientId,
}: CreateMessageParams): Message {
  const message: Message = {
    id: generateId() as MessageId,
    roomId,
    senderId,
    senderType,
    content,
    visibility,
    recipientId,
    createdAt: new Date(),
  }

  if (!messagesByRoom.has(roomId)) {
    messagesByRoom.set(roomId, [])
  }

  messagesByRoom.get(roomId)?.push(message)

  return message
}

/**
 * Gets all messages from a room
 */
export function getRoomMessages(
  roomId: RoomId,
  options?: {
    limit?: number
    since?: Date
    publicOnly?: boolean
  }
): Message[] {
  let messages = messagesByRoom.get(roomId) || []

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
 * Gets hidden messages for a specific assistant
 */
export function getHiddenMessagesForAssistant(
  roomId: RoomId,
  assistantId: AssistantId
): Message[] {
  const messages = messagesByRoom.get(roomId) || []

  return messages.filter(
    (m) =>
      m.visibility === 'hidden' &&
      (m.recipientId === assistantId || m.recipientId === undefined)
  )
}

/**
 * Gets a specific message by ID
 */
export function getMessage(roomId: RoomId, messageId: MessageId): Message | undefined {
  const messages = messagesByRoom.get(roomId) || []
  return messages.find((m) => m.id === messageId)
}

/**
 * Counts messages in a room
 */
export function countMessages(roomId: RoomId, publicOnly = false): number {
  const messages = messagesByRoom.get(roomId) || []

  if (publicOnly) {
    return messages.filter((m) => m.visibility === 'public').length
  }

  return messages.length
}

/**
 * Clears messages from a room
 */
export function clearRoomMessages(roomId: RoomId): void {
  messagesByRoom.delete(roomId)
}

/**
 * Prepares message context to send to an assistant
 */
export function prepareContextForAssistant(
  roomId: RoomId,
  assistantId: AssistantId,
  contextLimit = 50
): Message[] {
  const publicMessages = getRoomMessages(roomId, {
    limit: contextLimit,
    publicOnly: true,
  })

  const hiddenInstructions = getHiddenMessagesForAssistant(roomId, assistantId)

  const all = [...publicMessages, ...hiddenInstructions]
  all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  return all
}

// =============================================================================
// CONTENT HELPERS
// =============================================================================

/**
 * Creates text content
 */
export function createTextContent(text: string): MessageContent {
  return { type: 'text', text }
}

/**
 * Creates image content
 */
export function createImageContent(
  url: string,
  altText?: string,
  width?: number,
  height?: number
): MessageContent {
  return { type: 'image', url, altText, width, height }
}

/**
 * Creates file content
 */
export function createFileContent(
  url: string,
  fileName: string,
  sizeBytes: number,
  mimeType: string
): MessageContent {
  return { type: 'file', url, fileName, sizeBytes, mimeType }
}

// =============================================================================
// EXPORTS FOR TESTS / DEBUG
// =============================================================================

export function getAllMessages(): Map<RoomId, Message[]> {
  return messagesByRoom
}

export function clearAll(): void {
  messagesByRoom.clear()
}
