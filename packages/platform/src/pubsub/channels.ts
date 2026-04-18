/**
 * Pub/Sub Channel Registry
 * Defines channel names and their associated payload types
 */

/**
 * Chat message sent payload
 */
export interface MessageSentPayload {
  messageId: string
  roomId: string
  userId: string
  content: string
  timestamp: string
}

/**
 * Chat message updated payload
 */
export interface MessageUpdatedPayload {
  messageId: string
  roomId: string
  userId: string
  content: string
  timestamp: string
}

/**
 * Chat message deleted payload
 */
export interface MessageDeletedPayload {
  messageId: string
  roomId: string
  userId: string
  timestamp: string
}

/**
 * User status changed payload
 */
export interface UserStatusChangedPayload {
  userId: string
  status: 'online' | 'offline' | 'away'
  timestamp: string
}

/**
 * User profile updated payload
 */
export interface UserProfileUpdatedPayload {
  userId: string
  fields: string[]
  timestamp: string
}

/**
 * Room created payload
 */
export interface RoomCreatedPayload {
  roomId: string
  ownerId: string
  name: string
  timestamp: string
}

/**
 * Room updated payload
 */
export interface RoomUpdatedPayload {
  roomId: string
  userId: string
  fields: string[]
  timestamp: string
}

/**
 * Room deleted payload
 */
export interface RoomDeletedPayload {
  roomId: string
  userId: string
  timestamp: string
}

/**
 * Room member joined payload
 */
export interface RoomMemberJoinedPayload {
  roomId: string
  userId: string
  timestamp: string
}

/**
 * Room member left payload
 */
export interface RoomMemberLeftPayload {
  roomId: string
  userId: string
  timestamp: string
}

/**
 * Room assistant configured payload
 */
export interface RoomAssistantConfiguredPayload {
  roomId: string
  userId: string
  assistantId: string
  timestamp: string
}

/**
 * Channel registry mapping channel names to payload types
 * Use this to ensure type safety when publishing/subscribing
 */
export interface ChannelRegistry {
  'chat.message.sent': MessageSentPayload
  'chat.message.updated': MessageUpdatedPayload
  'chat.message.deleted': MessageDeletedPayload
  'user.status.changed': UserStatusChangedPayload
  'user.profile.updated': UserProfileUpdatedPayload
  'room.created': RoomCreatedPayload
  'room.updated': RoomUpdatedPayload
  'room.deleted': RoomDeletedPayload
  'room.member.joined': RoomMemberJoinedPayload
  'room.member.left': RoomMemberLeftPayload
  'room.assistant.configured': RoomAssistantConfiguredPayload
}

/**
 * Get a channel name from the registry (type-safe)
 */
export type ChannelName = keyof ChannelRegistry

/**
 * Get the payload type for a specific channel
 */
export type ChannelPayload<T extends ChannelName> = ChannelRegistry[T]

/**
 * Channel constants grouped by domain
 */
export const CHANNELS = {
  CHAT: {
    MESSAGE_SENT: 'chat.message.sent' as const,
    MESSAGE_UPDATED: 'chat.message.updated' as const,
    MESSAGE_DELETED: 'chat.message.deleted' as const,
  },
  USER: {
    STATUS_CHANGED: 'user.status.changed' as const,
    PROFILE_UPDATED: 'user.profile.updated' as const,
  },
  ROOM: {
    CREATED: 'room.created' as const,
    UPDATED: 'room.updated' as const,
    DELETED: 'room.deleted' as const,
    MEMBER_JOINED: 'room.member.joined' as const,
    MEMBER_LEFT: 'room.member.left' as const,
    ASSISTANT_CONFIGURED: 'room.assistant.configured' as const,
  },
} as const
