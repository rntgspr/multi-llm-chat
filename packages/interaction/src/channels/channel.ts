import type { ChannelId, ChannelType, IncomingMessage, OutgoingMessage } from '@synergy/types'

/**
 * Interface that all communication channels must implement.
 * This abstraction allows the chat core to work with any messaging platform.
 */
export interface Channel {
  readonly id: ChannelId
  readonly type: ChannelType

  /**
   * Establishes connection to the channel
   */
  connect(): Promise<void>

  /**
   * Gracefully disconnects from the channel
   */
  disconnect(): Promise<void>

  /**
   * Registers a handler for incoming messages
   */
  onMessage(handler: (msg: IncomingMessage) => void): void

  /**
   * Sends a message to the channel
   */
  send(msg: OutgoingMessage): Promise<void>

  /**
   * Whether this channel supports token-by-token streaming
   */
  supportsStreaming(): boolean

  /**
   * Sends a single token (for streaming responses).
   * Only available if supportsStreaming() returns true.
   */
  sendToken?(messageId: string, token: string): Promise<void>

  /**
   * Signals end of streaming for a message.
   * Only available if supportsStreaming() returns true.
   */
  endStream?(messageId: string): Promise<void>
}

/**
 * Base configuration for channels
 */
export interface ChannelConfig {
  id: ChannelId
  type: ChannelType
  enabled: boolean
  metadata?: Record<string, unknown>
}
