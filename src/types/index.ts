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

export type SenderType = 'user' | 'assistant' | 'orchestrator'
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

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestratorDecision {
  shouldRespond: boolean
  targetAssistants: AssistantId[]
  hiddenInstruction?: string
}

export interface OrchestratorConfig {
  roomId: RoomId
  rules: OrchestrationRule[]
}

export interface OrchestrationRule {
  condition: string
  targetAssistant: AssistantId
  priority: number
}
