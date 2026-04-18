import type { ChannelId, ChannelType, IncomingMessage, OutgoingMessage } from '@synergy/types'
import type { Channel, ChannelConfig } from './channel'

type MessageHandler = (msg: IncomingMessage) => void

/**
 * Manages multiple communication channels.
 * Routes messages to/from the correct channel.
 */
export class ChannelManager {
  private channels = new Map<ChannelId, Channel>()
  private messageHandlers: MessageHandler[] = []

  /**
   * Registers a new channel
   */
  register(channel: Channel): void {
    if (this.channels.has(channel.id)) {
      throw new Error(`Channel ${channel.id} already registered`)
    }

    channel.onMessage((msg) => {
      this.messageHandlers.forEach((handler) => handler(msg))
    })

    this.channels.set(channel.id, channel)
  }

  /**
   * Unregisters a channel
   */
  unregister(channelId: ChannelId): boolean {
    const channel = this.channels.get(channelId)
    if (channel) {
      channel.disconnect()
      this.channels.delete(channelId)
      return true
    }
    return false
  }

  /**
   * Gets a channel by ID
   */
  get(channelId: ChannelId): Channel | undefined {
    return this.channels.get(channelId)
  }

  /**
   * Gets all channels of a specific type
   */
  getByType(type: ChannelType): Channel[] {
    return Array.from(this.channels.values()).filter((c) => c.type === type)
  }

  /**
   * Sends a message through a specific channel
   */
  async send(channelId: ChannelId, msg: OutgoingMessage): Promise<void> {
    const channel = this.channels.get(channelId)
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }
    await channel.send(msg)
  }

  /**
   * Sends a streaming token through a channel (if supported)
   */
  async sendToken(channelId: ChannelId, messageId: string, token: string): Promise<void> {
    const channel = this.channels.get(channelId)
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`)
    }
    if (!channel.supportsStreaming() || !channel.sendToken) {
      throw new Error(`Channel ${channelId} does not support streaming`)
    }
    await channel.sendToken(messageId, token)
  }

  /**
   * Registers a handler for incoming messages from any channel
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  /**
   * Connects all registered channels
   */
  async connectAll(): Promise<void> {
    await Promise.all(Array.from(this.channels.values()).map((c) => c.connect()))
  }

  /**
   * Disconnects all registered channels
   */
  async disconnectAll(): Promise<void> {
    await Promise.all(Array.from(this.channels.values()).map((c) => c.disconnect()))
  }

  /**
   * Lists all registered channels
   */
  list(): Channel[] {
    return Array.from(this.channels.values())
  }
}

// Singleton instance
export const channelManager = new ChannelManager()
