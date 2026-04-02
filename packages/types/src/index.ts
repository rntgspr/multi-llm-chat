/**
 * Core types and interfaces for Multi-LLM Chat
 */

// =============================================================================
// IDENTIFIERS
// =============================================================================

export type UserId = string
export type RoomId = string
export type MessageId = string
export type AssistantId = string
export type InviteId = string
export type ChannelId = string

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: UserId
  name: string
  email: string
  avatarUrl?: string
  createdAt: Date
}

// =============================================================================
// ASSISTANT
// =============================================================================

export type AssistantStatus = 'online' | 'offline' | 'busy'

export interface Assistant {
  id: AssistantId
  name: string
  description: string
  avatarUrl?: string
  endpoint: string
  status: AssistantStatus
}

// =============================================================================
// ROOM
// =============================================================================

export interface Room {
  id: RoomId
  name: string
  createdBy: UserId
  createdAt: Date
  participants: UserId[]
  assistants: AssistantId[]
  activeInvite?: Invite
}

export interface Invite {
  id: InviteId
  roomId: RoomId
  code: string
  createdBy: UserId
  createdAt: Date
  expiresAt?: Date
  usesRemaining?: number
}

// =============================================================================
// MESSAGE
// =============================================================================

export type SenderType = 'user' | 'assistant' | 'navigator'
export type MessageVisibility = 'public' | 'hidden'
export type ContentType = 'text' | 'image' | 'file'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image'
  url: string
  altText?: string
  width?: number
  height?: number
}

export interface FileContent {
  type: 'file'
  url: string
  fileName: string
  sizeBytes: number
  mimeType: string
}

export type MessageContent = TextContent | ImageContent | FileContent

export interface Message {
  id: MessageId
  roomId: RoomId
  senderId: UserId | AssistantId
  senderType: SenderType
  content: MessageContent[]
  visibility: MessageVisibility
  recipientId?: AssistantId
  createdAt: Date
}

// =============================================================================
// CHANNELS (Multi-canal)
// =============================================================================

export type ChannelType = 'web' | 'whatsapp' | 'telegram' | 'messenger' | 'slack'

export interface IncomingMessage {
  channelId: ChannelId
  channelType: ChannelType
  externalUserId: string
  externalRoomId?: string
  content: MessageContent[]
  metadata?: Record<string, unknown>
}

export interface OutgoingMessage {
  channelId: ChannelId
  externalUserId: string
  externalRoomId?: string
  content: MessageContent[]
  replyToExternalId?: string
}

// =============================================================================
// CHAT EVENTS (Message Bus)
// =============================================================================

export type ChatEvent =
  | { type: 'user-message'; roomId: RoomId; message: Message }
  | { type: 'assistant-start'; roomId: RoomId; assistantId: AssistantId; messageId: MessageId }
  | { type: 'assistant-token'; roomId: RoomId; messageId: MessageId; token: string }
  | { type: 'assistant-end'; roomId: RoomId; messageId: MessageId }
  | { type: 'assistant-error'; roomId: RoomId; messageId: MessageId; error: string }
  | { type: 'input-blocked'; roomId: RoomId; blocked: boolean }

// =============================================================================
// WEBSOCKET EVENTS
// =============================================================================

export interface JoinRoomEvent {
  roomId: RoomId
  userId: UserId
}

export interface LeaveRoomEvent {
  roomId: RoomId
  userId: UserId
}

export interface NewMessageEvent {
  message: Message
}

export interface TypingEvent {
  roomId: RoomId
  senderId: UserId | AssistantId
  senderType: SenderType
  isTyping: boolean
}

export interface AssistantStatusEvent {
  assistantId: AssistantId
  status: AssistantStatus
}

// =============================================================================
// NAVIGATOR (ex-Orchestrator)
// =============================================================================

export interface RoutingPlan {
  assistants: AssistantId[]
  reasoning: string
  shouldBlock: boolean
}

export interface NavigatorDecision {
  shouldRespond: boolean
  targetAssistants: AssistantId[]
  hiddenInstruction?: string
}

export interface NavigatorConfig {
  roomId: RoomId
  rules: NavigationRule[]
}

export interface NavigationRule {
  condition: string
  targetAssistant: AssistantId
  priority: number
}

// =============================================================================
// ASSISTANT PAYLOADS
// =============================================================================

export interface AssistantPayload {
  roomId: RoomId
  assistantId: AssistantId
  messages: Message[]
  hiddenInstruction?: string
}

export interface AssistantResponse {
  roomId: RoomId
  assistantId: AssistantId
  content: MessageContent[]
}
