/**
 * Pub/Sub Subscriber Implementation
 * Subscribes to Redis channels and handles incoming events
 */

import Redis from 'ioredis'

import { loadRedisConfig } from '../cache/config'

import type { PubSubEnvelope, PubSubSubscriber, Unsubscribe } from './types'

/**
 * Redis-backed Pub/Sub subscriber
 */
export class RedisPubSubSubscriber implements PubSubSubscriber {
  private readonly subscribeClient: Redis
  private readonly handlers: Map<string, Array<(message: PubSubEnvelope<any>) => void | Promise<void>>> = new Map()

  constructor() {
    // Create a dedicated Redis client for subscribing
    // (ioredis requires a separate client for pub/sub operations)
    const config = loadRedisConfig()

    this.subscribeClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      lazyConnect: false,
    })

    // Set up message handler
    this.subscribeClient.on('message', (channel, message) => {
      this.handleMessage(channel, message)
    })

    this.subscribeClient.on('error', (error) => {
      console.error('[Subscriber] Redis error:', error)
    })

    console.log('[Subscriber] Redis subscriber client initialized')
  }

  /**
   * Subscribe to a channel
   */
  async subscribe<TPayload>(
    channel: string,
    handler: (message: PubSubEnvelope<TPayload>) => void | Promise<void>
  ): Promise<Unsubscribe> {
    // Add handler to the list
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, [])
      // Subscribe to Redis channel
      await this.subscribeClient.subscribe(channel)
      console.log(`[Subscriber] Subscribed to channel: ${channel}`)
    }

    const handlers = this.handlers.get(channel)
    if (handlers) {
      handlers.push(handler)
      console.log(`[Subscriber] Added handler to ${channel} (${handlers.length} total handlers)`)
    }

    // Return unsubscribe function
    return async () => {
      await this.unsubscribe(channel, handler)
    }
  }

  /**
   * Unsubscribe a specific handler from a channel
   */
  private async unsubscribe<TPayload>(
    channel: string,
    handler: (message: PubSubEnvelope<TPayload>) => void | Promise<void>
  ): Promise<void> {
    const handlers = this.handlers.get(channel)

    if (!handlers) {
      return
    }

    // Remove the handler
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
      console.log(`[Subscriber] Removed handler from ${channel} (${handlers.length} remaining)`)
    }

    // If no more handlers, unsubscribe from Redis channel
    if (handlers.length === 0) {
      this.handlers.delete(channel)
      await this.subscribeClient.unsubscribe(channel)
      console.log(`[Subscriber] Unsubscribed from channel: ${channel}`)
    }
  }

  /**
   * Handle incoming message from Redis
   */
  private handleMessage(channel: string, message: string): void {
    const handlers = this.handlers.get(channel)

    if (!handlers || handlers.length === 0) {
      return
    }

    try {
      // Deserialize message envelope
      const envelope = JSON.parse(message) as PubSubEnvelope<unknown>

      console.log(`[Subscriber] Received message on ${channel}: ${envelope.messageId}`)

      // Call all handlers for this channel
      for (const handler of handlers) {
        try {
          const result = handler(envelope)

          // Handle async handlers
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error(`[Subscriber] Handler error for ${channel}:`, error)
            })
          }
        } catch (error) {
          // Catch synchronous handler errors
          console.error(`[Subscriber] Handler error for ${channel}:`, error)
          // Continue processing other handlers
        }
      }
    } catch (error) {
      // Deserialization error - malformed message
      console.error(`[Subscriber] Failed to parse message from ${channel}:`, error)
      console.error('[Subscriber] Malformed message:', message)
      // Drop malformed messages
    }
  }

  /**
   * Disconnect the subscriber client
   */
  async disconnect(): Promise<void> {
    await this.subscribeClient.quit()
    this.handlers.clear()
    console.log('[Subscriber] Disconnected')
  }
}
