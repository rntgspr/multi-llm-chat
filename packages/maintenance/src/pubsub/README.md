# Redis Pub/Sub - Channel Conventions

## Channel Naming Convention

All Pub/Sub channels MUST follow this format:

```
<domain>.<entity>.<action>
```

### Examples

- `chat.message.sent` - Emitted when a chat message is sent
- `chat.message.updated` - Emitted when a message is edited
- `chat.message.deleted` - Emitted when a message is removed
- `user.status.changed` - Emitted when a user's online/offline status changes
- `user.profile.updated` - Emitted when a user updates their profile
- `room.created` - Emitted when a new chat room is created
- `room.member.joined` - Emitted when a user joins a room
- `room.member.left` - Emitted when a user leaves a room

## Fire-and-Forget Semantics (v1)

The current implementation uses **fire-and-forget** delivery semantics:

- **No delivery guarantees**: If no subscribers are active, messages are lost
- **No message persistence**: Messages are not stored in Redis
- **No retry mechanism**: Failed deliveries are not retried
- **Subscriber responsibility**: Subscribers must handle errors gracefully

## Best Practices

### 1. Keep Payloads Small

Pub/Sub is designed for lightweight notifications, not bulk data transfer.

```typescript
// ❌ BAD: Sending full message history
publish('chat.history.loaded', { messages: [...1000 messages] })

// ✅ GOOD: Sending notification with ID
publish('chat.message.sent', { messageId: '123', roomId: 'abc' })
```

### 2. Handle Malformed Messages

Subscribers should always validate incoming messages:

```typescript
subscribe<MessagePayload>('chat.message.sent', (message) => {
  if (!message.payload.messageId) {
    console.error('[Subscriber] Invalid message:', message)
    return // Drop malformed messages
  }
  
  // Process valid message
})
```

### 3. Avoid Blocking Operations

Subscriber handlers should be fast and non-blocking:

```typescript
// ❌ BAD: Synchronous database writes
subscribe('user.status.changed', async (message) => {
  await db.update(...) // Blocks other messages
})

// ✅ GOOD: Queue for async processing
subscribe('user.status.changed', (message) => {
  taskQueue.push(() => db.update(...))
})
```

### 4. Use Typed Payloads

Define strict types for each channel:

```typescript
// Define payload types
interface MessageSentPayload {
  messageId: string
  roomId: string
  userId: string
  timestamp: string
}

// Use typed publish/subscribe
publisher.publish<MessageSentPayload>('chat.message.sent', {
  messageId: '...',
  // TypeScript enforces all required fields
})
```

## Error Handling

### Publisher Errors

- **Redis unavailable**: Publish fails, error is logged
- **Serialization error**: Invalid payload, error is thrown

### Subscriber Errors

- **Handler error**: Logged and dropped, subscriber continues running
- **Deserialization error**: Malformed message is logged and dropped
- **Connection error**: Subscriber reconnects automatically (handled by ioredis)

## Future Enhancements (v2)

Potential improvements for future versions:

- **Guaranteed delivery**: Message persistence with acknowledgments
- **At-least-once semantics**: Retry failed deliveries
- **Dead letter queue**: Store messages that fail processing
- **Message expiration**: TTL for undelivered messages
- **Consumer groups**: Load balancing across multiple subscribers
- **Priority channels**: High-priority vs low-priority events

## Usage Examples

See the implementation examples in:
- `apps/web/src/services/event-publisher.ts` - Publishing events
- `apps/api/src/subscribers/event-subscriber.ts` - Subscribing to events
