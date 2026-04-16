# Data Model — EPIC-003 Redis Session Store and Pub/Sub

## Entity: Session

### Purpose
Represents an authenticated user session persisted in Redis with automatic expiration.

### Fields
- `sessionId` (string, required): Unique session token/key.
- `userId` (string, required): Authenticated user identifier.
- `email` (string, required): User email used in auth context.
- `name` (string, optional): User display name.
- `createdAt` (ISO timestamp, required): Session creation time.
- `updatedAt` (ISO timestamp, required): Last update time.
- `expiresAt` (ISO timestamp, required): Logical expiration timestamp.
- `metadata` (object, optional): Provider/session metadata.

### Validation Rules
- `sessionId` must be non-empty and unique.
- `expiresAt` must be greater than `createdAt`.
- Default TTL must be 30 days (`2592000` seconds) unless overridden by explicit policy.

### State Transitions
- `active` → `expired`: when TTL reaches zero or `expiresAt` is in the past.
- `active` → `revoked`: explicit logout/delete.
- `expired` / `revoked` are terminal states.

---

## Entity: CacheEntry<T>

### Purpose
Represents a typed key/value entry stored in Redis for reusable cache operations.

### Fields
- `key` (string, required): Cache key.
- `value` (generic `T`, required): JSON-serializable payload.
- `ttlSeconds` (number, optional): Entry-specific TTL.
- `createdAt` (ISO timestamp, optional): Optional observability metadata.

### Validation Rules
- `key` must be non-empty.
- `value` must be JSON-serializable.
- `ttlSeconds` (if provided) must be a positive integer.

### State Transitions
- `present` → `expired`: TTL elapsed.
- `present` → `deleted`: explicit delete operation.

---

## Entity: PubSubChannel

### Purpose
Represents a named event channel shared between web and API services.

### Fields
- `name` (string, required): Channel identifier using `<domain>.<entity>.<action>` format.
- `schemaVersion` (string, required): Event contract version (example: `v1`).
- `payloadSchema` (type descriptor, required): Runtime/compile-time message structure.

### Validation Rules
- `name` must match naming convention and be unique in registry.
- Every channel must define one payload contract.

---

## Entity: PubSubMessage<T>

### Purpose
Represents one published event envelope.

### Fields
- `messageId` (string, required): Event identifier.
- `channel` (string, required): Target channel name.
- `timestamp` (ISO timestamp, required): Publish timestamp.
- `type` (string, required): Logical event type.
- `payload` (generic `T`, required): Message data.
- `producer` (string, optional): Origin service identifier (`web`, `api`, `worker`).

### Validation Rules
- `payload` must satisfy channel schema.
- `timestamp` must be valid ISO datetime.
- `channel` must exist in channel registry.

### State Transitions
- `published` → `delivered`: received by active subscriber(s).
- `published` → `dropped`: no subscribers or subscriber error (accepted in fire-and-forget v1).

---

## Entity Relationships

- One `Session` maps to one authenticated user context (`userId`).
- One `PubSubChannel` has many `PubSubMessage` instances.
- `CacheEntry<T>` is independent and can back session and feature-specific caching patterns.
