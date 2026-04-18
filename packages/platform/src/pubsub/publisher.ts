/**
 * Pub/Sub Publisher Implementation
 * Publishes typed events to Redis channels
 */

import { randomUUID } from 'node:crypto'

import { getRedisClient } from '../cache/redis-client'

import type { PubSubEnvelope, PubSubPublisher } from './types'

/**
 * Redis-backed Pub/Sub publisher
 */
export class RedisPubSubPublisher implements PubSubPublisher {
  private readonly producer: 'web' | 'api' | 'worker'

  constructor(producer: 'web' | 'api' | 'worker' = 'web') {
    this.producer = producer
  }

  /**
   * Publish a message to a channel
   */
  async publish<TPayload>(channel: string, envelope: PubSubEnvelope<TPayload>): Promise<void> {
    try {
      // Ensure envelope has required metadata
      const fullEnvelope: PubSubEnvelope<TPayload> = {
        messageId: envelope.messageId || randomUUID(),
        channel: envelope.channel || channel,
        type: envelope.type,
        timestamp: envelope.timestamp || new Date().toISOString(),
        payload: envelope.payload,
        producer: envelope.producer || this.producer,
      }

      const client = getRedisClient()
      const message = JSON.stringify(fullEnvelope)

      // Publish to channel (returns number of subscribers that received the message)
      const subscriberCount = await client.publish(channel, message)

      console.log(`[Publisher] Published to ${channel} (${subscriberCount} subscribers) - ${fullEnvelope.messageId}`)
    } catch (error) {
      console.error(`[Publisher] Failed to publish to ${channel}:`, error)
      throw new Error(
        `Failed to publish message to channel ${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Helper: Create and publish a message in one call
   */
  async publishEvent<TPayload>(channel: string, type: string, payload: TPayload): Promise<void> {
    await this.publish<TPayload>(channel, {
      messageId: randomUUID(),
      channel,
      type,
      timestamp: new Date().toISOString(),
      payload,
      producer: this.producer,
    })
  }
}
