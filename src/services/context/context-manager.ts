import type { RoomId, AssistantId, Message } from '@/types'
import { prepareContextForAssistant } from '@/services/messages/message-manager'
import { getRoom } from '@/services/rooms/room-manager'

// =============================================================================
// CONTEXT CONFIGURATION
// =============================================================================

interface ContextConfig {
  maxMessages: number
  includeSystemMessages: boolean
  windowHours: number
}

const defaultContextConfig: ContextConfig = {
  maxMessages: 50,
  includeSystemMessages: true,
  windowHours: 24,
}

const configByRoom = new Map<RoomId, ContextConfig>()

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Gets context configuration for a room
 */
export function getContextConfig(roomId: RoomId): ContextConfig {
  return configByRoom.get(roomId) || defaultContextConfig
}

/**
 * Sets context configuration for a room
 */
export function setContextConfig(
  roomId: RoomId,
  config: Partial<ContextConfig>
): void {
  const current = getContextConfig(roomId)
  configByRoom.set(roomId, { ...current, ...config })
}

/**
 * Gets context for an assistant in a room
 */
export function getAssistantContext(
  roomId: RoomId,
  assistantId: AssistantId
): Message[] {
  const room = getRoom(roomId)
  if (!room) return []

  const config = getContextConfig(roomId)

  return prepareContextForAssistant(roomId, assistantId, config.maxMessages)
}

/**
 * Clears context configuration for a room
 */
export function clearRoomContext(roomId: RoomId): void {
  configByRoom.delete(roomId)
}
