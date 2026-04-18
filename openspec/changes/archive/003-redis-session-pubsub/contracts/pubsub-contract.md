# Contract: Pub/Sub

## Purpose
Defines typed publication/subscription contracts for cross-service event delivery.

## Channel Naming

All channels must follow:

`<domain>.<entity>.<action>`

Examples:

- `chat.message.sent`
- `chat.message.updated`
- `user.status.changed`

## Type Contract (TypeScript)

```ts
export interface PubSubEnvelope<TPayload> {
  messageId: string
  channel: string
  type: string
  timestamp: string
  payload: TPayload
  producer?: 'web' | 'api' | 'worker'
}

export type Unsubscribe = () => Promise<void> | void

export interface PubSubPublisher {
  publish<TPayload>(channel: string, message: PubSubEnvelope<TPayload>): Promise<void>
}

export interface PubSubSubscriber {
  subscribe<TPayload>(channel: string, handler: (message: PubSubEnvelope<TPayload>) => void | Promise<void>): Promise<Unsubscribe>
}
```

## Behavioral Rules

- Delivery semantics are fire-and-forget in v1.
- Publishing to channels without active subscribers is successful (no error).
- Malformed payloads must be logged and dropped by subscribers.
- Subscriber handler errors must not crash the subscriber process.
