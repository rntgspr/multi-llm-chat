# multi-llm-chat Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-09

## Active Technologies
- TypeScript 5.x, Node.js 20+, Next.js 16.2.2, React 19.2.4 + `next-auth@5.0.0-beta.30`, `ioredis`, `redis:7-alpine` (Docker), workspace packages (`@multi-llm/maintenance`, `@multi-llm/types`) (003-redis-session-pubsub)
- Redis 7 (session + cache + pub/sub), SurrealDB remains unchanged for persistent chat domain data (003-redis-session-pubsub)

- TypeScript 5.x / Node.js 20+ + Redis 7 (alpine), ioredis (Redis client), next-auth 5.0 beta, @upstash/redis (alternative adapter) (003-redis-session-pubsub)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x / Node.js 20+: Follow standard conventions

## Recent Changes
- 003-redis-session-pubsub: Added TypeScript 5.x, Node.js 20+, Next.js 16.2.2, React 19.2.4 + `next-auth@5.0.0-beta.30`, `ioredis`, `redis:7-alpine` (Docker), workspace packages (`@multi-llm/maintenance`, `@multi-llm/types`)

- 003-redis-session-pubsub: Added TypeScript 5.x / Node.js 20+ + Redis 7 (alpine), ioredis (Redis client), next-auth 5.0 beta, @upstash/redis (alternative adapter)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
