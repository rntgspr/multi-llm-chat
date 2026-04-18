/**
 * Pub/Sub types and interfaces
 */

/**
 * Message envelope for Pub/Sub communication
 */
export interface PubSubEnvelope<TPayload = unknown> {
  messageId: string
  channel: string
  type: string
  timestamp: string
  payload: TPayload
  correlationId?: string // For distributed tracing
  producer?: 'web' | 'api' | 'worker'
}

/**
 * Function to unsubscribe from a channel
 */
export type Unsubscribe = () => Promise<void> | void

/**
 * Publisher interface for sending events
 */
export interface PubSubPublisher {
  /**
   * Publish a message to a channel
   * @param channel - Channel name (format: domain.entity.action)
   * @param message - Message envelope with payload
   */
  publish<TPayload>(channel: string, message: PubSubEnvelope<TPayload>): Promise<void>
}

/**
 * Subscriber interface for receiving events
 */
export interface PubSubSubscriber {
  /**
   * Subscribe to a channel
   * @param channel - Channel name to subscribe to
   * @param handler - Callback function to handle messages
   * @returns Function to unsubscribe
   */
  subscribe<TPayload>(
    channel: string,
    handler: (message: PubSubEnvelope<TPayload>) => void | Promise<void>
  ): Promise<Unsubscribe>
}
