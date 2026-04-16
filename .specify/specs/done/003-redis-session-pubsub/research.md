# Research — EPIC-003 Redis Session Store and Pub/Sub

## Decision 1: Use ioredis as the primary Redis client

- **Decision**: Adopt `ioredis` for Redis connectivity in runtime services (`apps/web`, `apps/api`, shared package code).
- **Rationale**: The deployment target is self-hosted Redis in Docker Compose (`redis:7-alpine`), and `ioredis` provides stable support for pub/sub patterns, connection lifecycle controls, and broad Node.js ecosystem compatibility.
- **Alternatives considered**:
  - `@upstash/redis`: better fit for HTTP/serverless Redis, not the primary deployment model here.
  - `node-redis`: viable, but less aligned with existing internal guidance and ioredis-first assumptions in repository instructions.

## Decision 2: Centralize Redis runtime logic in `@multi-llm/maintenance`

- **Decision**: Implement Redis session/cache/pubsub runtime abstractions in `packages/maintenance`.
- **Rationale**: Both `apps/web` and `apps/api` already depend on `@multi-llm/maintenance`; this avoids duplicate clients and keeps auth/cache lifecycle concerns in a single bounded context.
- **Alternatives considered**:
  - Putting Redis code directly in each app: duplicates logic and risks drift.
  - Placing runtime client in `packages/types`: violates package responsibility (types-only package should stay runtime-light).

## Decision 3: Keep session TTL default at 30 days and enforce via Redis expiry

- **Decision**: Define default session TTL as `2592000` seconds (30 days) and apply TTL at write-time.
- **Rationale**: Directly satisfies FR-005/FR-007 and ensures automatic expiry behavior without manual cleanup jobs.
- **Alternatives considered**:
  - Manual cron cleanup: unnecessary complexity and delayed expiration behavior.
  - Short TTL defaults with client refresh-only: conflicts with feature requirements.

## Decision 4: Use typed error results for Redis failures

- **Decision**: Wrap connection/operation failures in typed error objects for cache/session/pubsub operations.
- **Rationale**: Satisfies FR-012, provides predictable failure handling, and allows graceful user-facing behavior during Redis outages.
- **Alternatives considered**:
  - Throwing raw client exceptions end-to-end: inconsistent error contracts across packages.
  - Silent fallback to in-memory state: breaks multi-instance consistency guarantees.

## Decision 5: Define explicit Pub/Sub channel naming convention

- **Decision**: Adopt dot-separated channel names: `<domain>.<entity>.<action>` (example: `chat.message.sent`, `user.status.changed`).
- **Rationale**: Satisfies FR-019, improves discoverability, and supports type-safe channel registries.
- **Alternatives considered**:
  - Free-form channel strings: higher collision risk and weak governance.
  - Room-id-only channels without semantic prefix: difficult for cross-domain event evolution.

## Decision 6: Preserve fire-and-forget semantics for v1 pub/sub

- **Decision**: Do not implement guaranteed delivery/retry/persistence in v1 Pub/Sub.
- **Rationale**: Aligns with feature assumptions and keeps implementation lean for EPIC-003 while still enabling real-time decoupling.
- **Alternatives considered**:
  - Redis Streams for durable events: stronger delivery semantics but materially higher complexity and out of scope.
  - Custom retry queue: adds operational burden not required by this epic.

## Decision 7: Keep Redis configuration environment-driven with safe defaults

- **Decision**: Use environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, optional db index) with development defaults.
- **Rationale**: Satisfies FR-020/FR-021/FR-022 and keeps local, staging, and production setup aligned.
- **Alternatives considered**:
  - Hardcoded connection strings: brittle and environment-specific.
  - Mandatory password in all environments: unnecessary friction for local development.
