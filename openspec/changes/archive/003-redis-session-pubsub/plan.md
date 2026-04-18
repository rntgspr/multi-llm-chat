# Implementation Plan: Redis Session Store & Pub/Sub Infrastructure

**Branch**: `003-redis-session-pubsub` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `.specify/specs/003-redis-session-pubsub/spec.md`

## Summary

Implement Redis-backed session persistence, type-safe cache client library, and Pub/Sub communication infrastructure to enable persistent authentication across application restarts and real-time event-driven communication between web and API services. The feature uses ioredis as the client library, centralizes all Redis logic in `@synergy/maintenance` package, enforces typed error handling, and maintains fire-and-forget semantics for v1 Pub/Sub implementation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+  
**Primary Dependencies**: 
- `ioredis` (Redis client for Node.js)
- `next-auth@5.0.0-beta.30` (authentication framework in apps/web)
- `@auth/core@^0.34.3` (NextAuth core)
- `next@16.2.2` / `react@19.2.4` (App Router)
- Redis 7 (alpine) via Docker Compose

**Storage**: 
- Redis 7 (session store, cache, pub/sub) - ephemeral data
- SurrealDB (unchanged) - persistent chat domain data

**Testing**: Turborepo test task, package-level integration tests (not included in MVP per spec)  
**Target Platform**: Linux containers (Docker Compose) + macOS development  
**Project Type**: Monorepo web application (Next.js) + API service (Hono) + shared libraries  
**Performance Goals**: 
- Redis health check < 50ms (FR-003)
- Session read p95 < 10ms
- Pub/Sub fan-out delivery < 100ms (US3)

**Constraints**: 
- Session TTL default 30 days (FR-009)
- Fire-and-forget Pub/Sub v1 (no guaranteed delivery)
- Fail-fast on Redis unavailability at startup
- Graceful typed errors on Redis failures during runtime
- No breaking changes to existing package exports

**Scale/Scope**: 
- At least 1,000 concurrent sessions supported (SC-005 - validated post-MVP)
- Multi-instance web/api compatibility through shared Redis backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Arquitetura em 3 Camadas
**Status**: PASS  
All Redis logic will be centralized in `@synergy/maintenance` package. Apps (`web`, `api`) will only orchestrate, not contain business logic. Follows the established pattern where maintenance handles users, auth, and infrastructure concerns.

### ✅ II. TypeScript Estrito  
**Status**: PASS  
All code uses TypeScript strict mode. Type definitions in `@synergy/types`, explicit error types (`SessionStoreError`, `CacheError`, `PubSubError`), no `any` usage. JSDoc on all exported functions.

### ✅ III. Composição Sobre Herança
**Status**: PASS  
No class hierarchies. Uses composable client instances (`RedisClient`, `SessionStore`, `CacheClient`, `PubSubClient`) with clear interfaces. NextAuth adapter follows composition pattern.

### ✅ IV. Princípios SOLID
**Status**: PASS  
- **S**: Separate clients for session/cache/pubsub (single responsibility)
- **O**: Extensible via typed events and error handlers
- **L**: Interfaces honor Redis semantics
- **I**: Focused interfaces (ISessionStore, ICacheClient, IPubSubClient)
- **D**: Depends on Redis abstractions, not ioredis implementation details

### ✅ V. Componentes Server-First  
**Status**: PASS  
NextAuth integration runs entirely on server. No client-side Redis access. Web app uses server actions for session operations.

### ✅ VI. Simplicidade
**Status**: PASS  
Starts with fire-and-forget Pub/Sub (v1). No over-engineering. DRY: shared Redis connection manager. YAGNI: no message persistence, no guaranteed delivery in MVP.

**Final Gate Status**: ✅ **APPROVED** - All constitutional principles satisfied.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/003-redis-session-pubsub/
├── spec.md              # Feature specification
├── plan.md              # This file - implementation plan
├── research.md          # Technical research and decisions
├── data-model.md        # Data structures and schemas
├── quickstart.md        # Quick start guide
├── contracts/           # Interface contracts
│   ├── session-store.ts # SessionStore interface
│   ├── cache-client.ts  # CacheClient interface
│   └── pubsub-client.ts # PubSubClient interface
└── tasks.md             # Task breakdown (88 tasks)
```

### Source Code (monorepo structure)

```text
packages/maintenance/       # Redis infrastructure (NEW)
├── src/
│   ├── redis/
│   │   ├── client.ts          # NEW: RedisClient (shared connection manager)
│   │   ├── session-store.ts   # NEW: SessionStore implementation
│   │   ├── cache-client.ts    # NEW: CacheClient implementation
│   │   ├── pubsub-client.ts   # NEW: PubSubClient implementation
│   │   ├── errors.ts          # NEW: SessionStoreError, CacheError, PubSubError
│   │   └── health.ts          # NEW: Redis health check
│   ├── auth/
│   │   └── redis-adapter.ts   # NEW: NextAuth Redis adapter
│   └── index.ts               # UPDATE: export Redis clients
└── package.json               # UPDATE: add ioredis dependency

packages/types/                # Type definitions (NEW)
└── src/
    └── redis/
        ├── session.ts         # NEW: SessionData, SessionMetadata types
        ├── cache.ts           # NEW: CacheOptions, CacheEntry types
        └── pubsub.ts          # NEW: PubSubEvent, Channel types

apps/web/                      # Next.js web application
├── src/
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts  # UPDATE: configure Redis adapter
│   └── actions/
│       └── chat.ts           # UPDATE: publish events via Pub/Sub
├── .env.local                # UPDATE: add Redis environment variables
└── package.json              # UPDATE: add @synergy/maintenance dependency

apps/api/                      # Hono API service
├── src/
│   ├── websocket/
│   │   └── handler.ts        # UPDATE: subscribe to Pub/Sub channels
│   ├── middleware/
│   │   └── session.ts        # UPDATE: validate sessions from Redis
│   └── index.ts              # UPDATE: initialize Pub/Sub subscriber on startup
├── .env                      # UPDATE: add Redis environment variables
└── package.json              # UPDATE: add @synergy/maintenance dependency

docker-compose.yml             # VERIFY: Redis 7 service already configured
.env.example                   # UPDATE: document Redis environment variables
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitutional principles satisfied. No complexity justifications needed.

## Security Considerations

### Development Environment
- Redis runs without password in Docker Compose (localhost only)
- No TLS encryption needed (internal container network)
- Default port 6379 not exposed to host

### Production Environment (Post-MVP)
**⚠️ Note**: Security configuration is documented but NOT implemented in MVP tasks. This section serves as a checklist for production deployment.

#### Authentication
- **Required**: Set `REDIS_PASSWORD` environment variable
- Configure `requirepass` in Redis config
- Update all clients to use `AUTH` command on connection

#### Network Security
- **Required**: Enable TLS/SSL encryption
- Configure Redis with `tls-cert-file`, `tls-key-file`, `tls-ca-cert-file`
- Update ioredis clients with `tls: {}` option
- Use `rediss://` protocol in connection strings

#### Access Control (Optional - Redis 6+)
- Create dedicated users with minimal permissions:
  - `session_user`: GET, SET, DEL, EXPIRE on `session:*` keys
  - `cache_user`: GET, SET, DEL, TTL on `cache:*` keys
  - `pubsub_user`: PUBLISH, SUBSCRIBE on specific channels
- Configure ACLs in `redis.conf` or via `ACL SETUSER` commands

#### Environment Variables (Production)
```bash
# Required for production
REDIS_HOST=redis.production.internal
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
REDIS_TLS_ENABLED=true
REDIS_TLS_CA_PATH=/path/to/ca.crt

# Optional ACL configuration
REDIS_USERNAME=app_user
```

#### Task Addition (Per User Decision)
A task has been added to Phase 7 (Polish) to implement conditional security configuration:
- **Task ID**: T-088-SECURITY
- **Description**: Implement Redis authentication and TLS for production
- **Scope**: Environment-conditional config, graceful fallback to insecure mode in dev

## Startup Behavior & Error Handling

### Redis Unavailability at Startup
**Decision**: **Fail-fast** - Application MUST NOT start if Redis is unavailable.

**Rationale**: 
- Session-based authentication is core functionality
- Running without sessions creates confusing UX (users can't login)
- Fail-fast ensures problems are caught immediately in deployment
- Simpler than implementing graceful degradation for MVP

**Implementation**:
- Add health check on app startup (before accepting requests)
- Throw error if Redis ping fails
- Log clear error message: "FATAL: Redis unavailable at {host}:{port}"
- Exit with code 1

### Redis Failures During Runtime
**Decision**: **Graceful degradation with typed errors**

**Rationale**:
- Temporary Redis blips shouldn't crash the app
- Users should see helpful error messages
- Observability: failures logged for monitoring

**Implementation**:
- All Redis operations return `Result<T, E>` or throw typed errors
- Session read failure: return 401 Unauthorized, log warning
- Session write failure: return 500 Internal Server Error, log error
- Cache miss on failure: treat as cache miss, log warning
- Pub/Sub publish failure: log error, continue (fire-and-forget)

### Error Types (Defined in contracts/errors.ts)
- `SessionStoreError`: connection, serialization, not found
- `CacheError`: connection, timeout, invalidKey
- `PubSubError`: connection, publish failed

## Load Testing & Performance Validation

### SC-005: 1000 Concurrent Sessions
**Decision**: **Move to post-MVP validation**

**Rationale**:
- Load testing requires infrastructure not in scope for MVP
- Can be validated after initial deployment using production traffic
- Focus MVP on functional correctness first

**Post-MVP Validation Plan**:
1. Deploy MVP to staging environment
2. Use load testing tool (k6, Artillery, or custom script)
3. Simulate 1000 concurrent users authenticating
4. Monitor Redis metrics: memory usage, ops/sec, p95 latency
5. Adjust Redis config if needed (maxmemory, eviction policy)

**Success Criteria** (unchanged from spec):
- Redis handles 1000 active sessions without errors
- Session read p95 < 10ms
- Memory usage < 100MB for session data alone

## Implementation Phases

### Phase 0: Foundation (Already Complete)
- ✅ Research completed (`research.md`)
- ✅ Data model defined (`data-model.md`)
- ✅ Contracts specified (`contracts/`)
- ✅ Quickstart documented (`quickstart.md`)

### Phase 1: Setup (5 tasks)
Install dependencies and configure environment

### Phase 2: Core Infrastructure (10 tasks)
Implement foundational Redis clients - **BLOCKS all user stories**

### Phase 3: User Story 1 - Session Persistence (13 tasks) 🎯 MVP
- NextAuth Redis adapter
- Session CRUD operations
- Logout flow integration (**NEW TASK ADDED**)
- Session expiration

### Phase 4: User Story 2 - Type-Safe Cache (15 tasks)
- Generic cache client
- TTL management
- Health checks

### Phase 5: User Story 3 - Pub/Sub Communication (21 tasks)
- Typed event schemas
- Publisher/subscriber clients
- Channel management

### Phase 6: Integration & Examples (11 tasks)
- Example implementations
- Documentation
- Quickstart validation

### Phase 7: Polish & Security (13 tasks + 1 NEW)
- Error handling improvements
- Logging standardization
- Monitoring hooks
- **Security configuration (NEW)** ← Added per user decision

**Total Tasks**: 89 (88 original + 1 security task)

## Next Steps

1. ✅ Plan complete - ready for `/speckit.tasks` to generate task breakdown
2. 📝 Tasks generated (88 → 89 after security task added)
3. 🔍 Run `/speckit.analyze` to validate consistency
4. 🔧 Fix any issues identified by analysis
5. 🚀 Begin implementation with Phase 1 (Setup)

---

**Last Updated**: 2026-04-16  
**Status**: ✅ **READY FOR IMPLEMENTATION**
