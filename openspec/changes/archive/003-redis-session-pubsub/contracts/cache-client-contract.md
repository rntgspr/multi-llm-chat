# Contract: Cache Client

## Purpose
Defines type-safe cache operations used across packages.

## Type Contract (TypeScript)

```ts
export interface CacheSetOptions {
  ttlSeconds?: number
}

export interface CacheError {
  code: 'REDIS_UNAVAILABLE' | 'SERIALIZATION_ERROR' | 'DESERIALIZATION_ERROR' | 'VALIDATION_ERROR'
  message: string
  cause?: unknown
}

export interface CacheClient {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>
  delete(key: string): Promise<boolean>
  exists(key: string): Promise<boolean>
  ttl(key: string): Promise<number>
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>
}
```

## Behavioral Rules

- `set` requires JSON-serializable `value`.
- `ttl` returns:
  - `-2` for missing key,
  - `-1` for key without expiry,
  - `>= 0` remaining seconds otherwise.
- Connection/config errors must surface as typed errors.
