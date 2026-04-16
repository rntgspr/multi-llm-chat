# Quickstart — EPIC-003 Redis Session Store and Pub/Sub

## 1) Start infrastructure

From repository root, start Redis (and other infra services):

- Use Docker Compose to bring up `redis` and dependencies.
- Confirm Redis health check returns `PONG`.

## 2) Configure environment

Define these variables for `apps/web` and `apps/api` environments:

- `REDIS_HOST` (default `localhost` in local dev)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD` (optional)
- `REDIS_DB` (optional, default `0`)
- `REDIS_SESSION_TTL_SECONDS` (default `2592000`)

## 3) Integrate shared Redis abstractions

Implement and export Redis modules in `packages/maintenance`:

- `cache/redis-client` for connection + health check
- `cache/operations` for typed get/set/delete/exists
- `auth/redis-session` for session CRUD + TTL
- `pubsub/publisher` and `pubsub/subscriber` for channel communication

## 4) Wire application usage

- Update `apps/web/src/lib/auth.ts` to use Redis-backed session persistence strategy.
- Update API/Web event paths to publish/subscribe via shared typed channels.

## 5) Verify acceptance criteria

### Session persistence
1. Authenticate a user in web.
2. Restart web service.
3. Verify session remains valid.

### Cache library type safety
1. Compile code with intentionally invalid cache call types.
2. Confirm compile-time type errors.
3. Verify valid calls round-trip typed data.

### Pub/Sub delivery
1. Start one publisher and at least one subscriber.
2. Publish typed event.
3. Confirm subscriber receives event in under 100ms under local test conditions.

## 6) Validation checklist

- Redis health check response < 50ms.
- Session lookup p95 < 10ms in local integration test baseline.
- Session TTL defaults to 30 days.
- Channel naming conventions documented and enforced.
- Redis outage paths return typed errors and avoid process crashes.
