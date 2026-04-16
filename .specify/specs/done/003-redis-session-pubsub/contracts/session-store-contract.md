# Contract: Session Store

## Purpose
Defines the Redis-backed session persistence interface used by authentication flows.

## Type Contract (TypeScript)

```ts
export interface SessionRecord {
  sessionId: string
  userId: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  metadata?: Record<string, unknown>
}

export interface SessionStoreError {
  code: 'REDIS_UNAVAILABLE' | 'SERIALIZATION_ERROR' | 'NOT_FOUND' | 'VALIDATION_ERROR'
  message: string
  cause?: unknown
}

export interface SessionStore {
  create(input: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'expiresAt'>, ttlSeconds?: number): Promise<SessionRecord>
  get(sessionId: string): Promise<SessionRecord | null>
  update(sessionId: string, patch: Partial<Pick<SessionRecord, 'email' | 'name' | 'metadata'>>, ttlSeconds?: number): Promise<SessionRecord | null>
  delete(sessionId: string): Promise<boolean>
}
```

## Behavioral Rules

- Default TTL is 30 days when `ttlSeconds` is omitted.
- `get` returns `null` for missing/expired sessions.
- `delete` is idempotent.
- On Redis failure, methods return/throw typed `SessionStoreError` according to project error policy.
