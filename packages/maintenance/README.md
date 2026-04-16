# @multi-llm/maintenance

Camada de Manutenção - Auth, users, rooms, config, Redis infrastructure

## Features

- User management
- Room management
- Authentication and session management
- **Redis Session Store**: Persistent user sessions with automatic expiration
- **Type-Safe Cache Client**: Generic cache operations with TTL management
- **Pub/Sub Communication**: Event-driven communication between services

## Redis Infrastructure

This package provides Redis-backed infrastructure for:

### 1. Session Store

Persistent authentication sessions that survive application restarts.

```typescript
import { RedisSessionStore } from '@multi-llm/maintenance'

const sessionStore = new RedisSessionStore()

// Create a session
const session = await sessionStore.create({
  sessionId: 'abc123',
  userId: 'user-1',
  email: 'user@example.com'
}, 2592000) // 30 days TTL

// Get a session
const retrieved = await sessionStore.get('abc123')

// Update a session
const updated = await sessionStore.update('abc123', {
  name: 'John Doe'
})

// Delete a session (logout)
await sessionStore.delete('abc123')
```

### 2. Cache Client

Type-safe cache operations for any JSON-serializable data.

```typescript
import { getCacheClient } from '@multi-llm/maintenance'

const cache = getCacheClient()

// Set with TTL
await cache.set('user:123:prefs', { theme: 'dark' }, { ttlSeconds: 3600 })

// Get typed value
const prefs = await cache.get<{ theme: string }>('user:123:prefs')

// Check existence
const exists = await cache.exists('user:123:prefs')

// Get TTL
const ttl = await cache.ttl('user:123:prefs')

// Delete
await cache.delete('user:123:prefs')

// Health check
const health = await cache.healthCheck()
console.log(`Redis: ${health.ok ? 'OK' : 'FAIL'} (${health.latencyMs}ms)`)
```

### 3. Pub/Sub

Event-driven communication with type-safe message contracts.

```typescript
import { getPublisher, getSubscriber } from '@multi-llm/maintenance'
import type { MessageSentPayload } from '@multi-llm/maintenance'

// Publishing events
const publisher = getPublisher('web')
await publisher.publishEvent<MessageSentPayload>(
  'chat.message.sent',
  'message.sent',
  {
    messageId: 'msg-1',
    roomId: 'room-1',
    userId: 'user-1',
    content: 'Hello!',
    timestamp: new Date().toISOString()
  }
)

// Subscribing to events
const subscriber = getSubscriber()
const unsubscribe = await subscriber.subscribe<MessageSentPayload>(
  'chat.message.sent',
  (message) => {
    console.log('New message:', message.payload.content)
  }
)

// Unsubscribe when done
await unsubscribe()
```

## Redis Setup

### Environment Variables

```bash
# Required
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Optional
REDIS_PASSWORD=         # Empty for development
REDIS_SESSION_TTL_SECONDS=2592000  # 30 days
```

### Docker Compose

Redis is included in `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5
```

Start Redis:

```bash
docker-compose up -d redis
```

## NextAuth Integration

Use the Redis adapter for persistent sessions:

```typescript
import NextAuth from 'next-auth'
import { RedisAdapter } from '@multi-llm/maintenance'

export const { handlers, auth } = NextAuth({
  adapter: RedisAdapter(),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [...]
})
```

## Channel Conventions

All Pub/Sub channels follow the format: `<domain>.<entity>.<action>`

Examples:
- `chat.message.sent`
- `chat.message.updated`
- `user.status.changed`
- `room.member.joined`

See `src/pubsub/README.md` for detailed conventions.

## Error Handling

All Redis operations return typed errors:

```typescript
import type { CacheError, SessionStoreError } from '@multi-llm/maintenance'

try {
  await cache.get('key')
} catch (error) {
  const cacheError = error as CacheError
  
  if (cacheError.code === 'REDIS_UNAVAILABLE') {
    console.error('Redis is down:', cacheError.message)
  } else if (cacheError.code === 'DESERIALIZATION_ERROR') {
    console.error('Invalid data:', cacheError.message)
  }
}
```

## Health Checks

Check Redis connectivity:

```typescript
import { healthCheck } from '@multi-llm/maintenance'

const health = await healthCheck()

if (!health.ok) {
  throw new Error('Redis unavailable')
}

if (health.latencyMs > 50) {
  console.warn('Redis latency high:', health.latencyMs)
}
```

## Examples

See the example implementations:
- Cache: `apps/web/src/services/cache-example.ts`
- Publisher: `apps/web/src/services/event-publisher.ts`
- Subscriber: `apps/api/src/subscribers/event-subscriber.ts`

## Production Considerations

For production deployments:

1. **Authentication**: Set `REDIS_PASSWORD`
2. **TLS**: Enable encryption for network security
3. **ACLs**: Use Redis ACLs for fine-grained access control
4. **Monitoring**: Track Redis metrics (memory, ops/sec, latency)
5. **Persistence**: Configure RDB/AOF for data durability (if needed)

See design docs for detailed security configuration.

## Edge Cases and Error Scenarios

### Redis Unavailable

**At startup**: Application fails to start (fail-fast behavior)
```
FATAL: Redis unavailable at localhost:6379
```

**During runtime**: Operations throw typed errors
```typescript
try {
  await cache.get('key')
} catch (error) {
  if (error.code === 'REDIS_UNAVAILABLE') {
    // Redis is down - handle gracefully
    // Log error, return default value, or propagate
  }
}
```

### Corrupted Data

**Deserialization errors**: When cached data cannot be parsed
```typescript
// Data corruption or manual modification in Redis
await cache.set('key', { value: 'test' })
// Someone manually edits Redis: SET key "invalid-json"
await cache.get('key') // Throws DESERIALIZATION_ERROR
```

**Solution**: Clear corrupted keys, implement data validation

### Memory Limits

**Redis maxmemory reached**: When Redis runs out of memory

**Eviction policies**:
- `noeviction`: Return errors when memory limit reached (default)
- `allkeys-lru`: Evict least recently used keys
- `volatile-lru`: Evict LRU keys with TTL set

**Recommendation**: Use `allkeys-lru` for cache, monitor memory usage

### Session Expiration

**Expired sessions**: Handled automatically via Redis TTL
```typescript
// Session expires after 30 days
// get() returns null for expired sessions
const session = await sessionStore.get('old-session-id')
// session === null
```

**Edge case**: Clock skew between servers
- Use NTP to synchronize clocks
- TTL is managed by Redis, not application time

### Pub/Sub Message Loss

**Fire-and-forget semantics**: Messages are not persisted

**Scenarios where messages are lost**:
1. No active subscribers when published
2. Subscriber crashes before processing message
3. Network partition between publisher and subscriber
4. Redis restart (messages in flight are lost)

**Mitigation** (for v2):
- Add message persistence with Redis Streams
- Implement consumer groups for at-least-once delivery
- Add retry logic for critical events

### Concurrent Modifications

**Cache updates**: Last write wins (no locking in v1)
```typescript
// Two processes update the same key simultaneously
// One write will overwrite the other
await cache.set('counter', 1)  // Process A
await cache.set('counter', 2)  // Process B (wins)
```

**Solution** (if needed):
- Use Redis transactions (MULTI/EXEC)
- Implement optimistic locking with WATCH
- Use Redis Lua scripts for atomic operations

### Connection Pool Exhaustion

**Symptom**: Slow response times, connection timeouts

**Causes**:
- Too many concurrent operations
- Connection leaks (not releasing connections)
- Network issues

**Solution**:
- Monitor connection pool metrics
- Adjust `maxRetriesPerRequest` setting
- Implement connection timeouts
- Use connection pooling (already configured)

### TTL Precision

**Redis TTL granularity**: Seconds (not milliseconds)
```typescript
// TTL is in seconds
await cache.set('key', value, { ttlSeconds: 1 })
// Actual expiration: 1-2 seconds (not precise to millisecond)
```

**For sub-second precision**: Not supported in v1

### Large Payloads

**Pub/Sub limitation**: Not designed for large messages

**Recommendation**:
- Keep messages < 1KB
- For large data, publish message ID and fetch from cache/database
- Monitor message sizes in production

```typescript
// ❌ BAD: Large payload
publisher.publish('channel', { data: [...10000 items] })

// ✅ GOOD: Reference-based
await cache.set('data:123', largeData, { ttlSeconds: 60 })
publisher.publish('channel', { dataId: '123' })
```
