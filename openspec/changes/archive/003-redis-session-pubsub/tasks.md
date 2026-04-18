# Tasks: EPIC-003 Redis Session Store and Pub/Sub

**Feature Branch**: `003-redis-session-pubsub`  
**Input**: Design documents from `.specify/specs/003-redis-session-pubsub/`  
**Prerequisites**: spec.md (user stories), plan.md (architecture), data-model.md (entities), contracts/ (interfaces), research.md (decisions), quickstart.md (validation)

**Tests**: Not explicitly requested in feature specification - focusing on implementation and manual validation via quickstart.md scenarios

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a monorepo project using pnpm workspaces:
- **Shared packages**: `packages/maintenance/` (Redis clients and utilities)
- **Web application**: `apps/web/` (Next.js with NextAuth)
- **API service**: `apps/api/` (Hono API)
- **Workers**: `apps/workers/` (Background jobs)
- **Infrastructure**: `docker-compose.yml` (Redis already configured)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install ioredis dependency in packages/maintenance/package.json
- [X] T002 Install @types/ioredis dev dependency in packages/maintenance/package.json
- [X] T003 [P] Update .env.example files in apps/web/ and apps/api/ with Redis environment variables (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_SESSION_TTL_SECONDS)
- [X] T004 [P] Update .env.local files in apps/web/ and apps/api/ with Redis development defaults
- [X] T005 Verify Redis container is running and accessible via health check (docker-compose up redis)

**Checkpoint**: Dependencies installed, environment configured, Redis running

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Redis infrastructure in packages/maintenance that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T0*6 Create packages/maintenance/src/cache/ directory structure
- [X] T0*7 Create packages/maintenance/src/auth/redis/ directory structure
- [X] T0*8 Create packages/maintenance/src/pubsub/ directory structure
- [X] T0*9 [P] Define CacheError type in packages/maintenance/src/cache/types.ts based on cache-client-contract.md
- [X] T0*10 [P] Define SessionStoreError type in packages/maintenance/src/auth/redis/types.ts based on session-store-contract.md
- [X] T0*11 [P] Define PubSubEnvelope and Unsubscribe types in packages/maintenance/src/pubsub/types.ts based on pubsub-contract.md
- [X] T0*12 Implement Redis configuration loader in packages/maintenance/src/cache/config.ts (reads environment variables, validates, provides defaults)
- [X] T0*13 Create base Redis client factory in packages/maintenance/src/cache/redis-client.ts (connection management, error handling, singleton pattern)
- [X] T0*14 Implement health check function in packages/maintenance/src/cache/redis-client.ts (returns { ok: boolean; latencyMs: number })
- [X] T0*15 Export all foundational types and clients from packages/maintenance/src/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Persistent Authentication Sessions (Priority: P1) 🎯 MVP

**Goal**: Enable sessions to persist across application restarts and be shared between web and API services

**Independent Test**: 
1. Authenticate a user in web app
2. Restart web service (docker-compose restart web)
3. Verify session remains valid without re-login
4. Verify session contains userId, email, and timestamp

### Implementation for User Story 1

- [X] T0*16 [P] [US1] Define SessionRecord interface in packages/maintenance/src/auth/redis/types.ts following session-store-contract.md
- [X] T0*17 [P] [US1] Define SessionStore interface in packages/maintenance/src/auth/redis/types.ts with create/get/update/delete methods
- [X] T0*18 [US1] Implement SessionStore class in packages/maintenance/src/auth/redis/session-store.ts with Redis operations
- [X] T0*19 [US1] Implement create() method in packages/maintenance/src/auth/redis/session-store.ts (stores session with 30-day TTL default)
- [X] T0*20 [US1] Implement get() method in packages/maintenance/src/auth/redis/session-store.ts (retrieves session, returns null if expired/missing)
- [X] T0*21 [US1] Implement update() method in packages/maintenance/src/auth/redis/session-store.ts (updates fields, resets TTL)
- [X] T0*22 [US1] Implement delete() method in packages/maintenance/src/auth/redis/session-store.ts (removes session, idempotent)
- [X] T0*23 [US1] Add error handling for Redis unavailability in packages/maintenance/src/auth/redis/session-store.ts (returns typed SessionStoreError)
- [X] T0*24 [US1] Export SessionStore from packages/maintenance/src/index.ts
- [X] T0*25 [US1] Create Redis session adapter for NextAuth in apps/web/src/lib/redis-adapter.ts (implements NextAuth Adapter interface)
- [X] T0*26 [US1] Update NextAuth configuration in apps/web/src/lib/auth.ts to use Redis session adapter
- [X] T0*27 [US1] Add session persistence configuration to apps/web/src/lib/auth.ts (strategy: "database", maxAge: 30 days)
- [X] T0*28 [US1] Update NextAuth callbacks in apps/web/src/lib/auth.ts to ensure userId and email are stored in session
- [X] T0*29 [US1] Implement logout callback in apps/web/src/lib/auth.ts to delete session from Redis on user logout (satisfies FR-009)

**Checkpoint**: At this point, User Story 1 should be fully functional - sessions persist across restarts, are accessible from multiple instances, and are properly deleted on logout

**Validation** (per quickstart.md):
- Authenticate user → restart web app → verify session valid
- Query session data → verify contains userId, email, timestamp
- Wait for 30 days → verify session auto-expires
- Run multiple web instances → verify session accessible from both

---

## Phase 4: User Story 2 - Type-Safe Cache Library (Priority: P2)

**Goal**: Provide reusable, type-safe cache operations for all applications in the monorepo

**Independent Test**:
1. Import cache client in test file
2. Attempt invalid type operations → verify compilation fails
3. Store and retrieve typed data → verify types match
4. Simulate Redis unavailability → verify typed errors returned
5. Run health check → verify response < 50ms

### Implementation for User Story 2

- [X] T0*30 [P] [US2] Define CacheClient interface in packages/maintenance/src/cache/types.ts following cache-client-contract.md
- [X] T0*31 [P] [US2] Define CacheSetOptions interface in packages/maintenance/src/cache/types.ts
- [X] T0*32 [US2] Implement CacheClient class in packages/maintenance/src/cache/operations.ts
- [X] T0*33 [US2] Implement get<T>() method in packages/maintenance/src/cache/operations.ts (deserializes JSON, returns null if missing)
- [X] T0*34 [US2] Implement set<T>() method in packages/maintenance/src/cache/operations.ts (serializes to JSON, applies TTL if provided)
- [X] T0*35 [US2] Implement delete() method in packages/maintenance/src/cache/operations.ts (returns boolean success)
- [X] T0*36 [US2] Implement exists() method in packages/maintenance/src/cache/operations.ts (checks key existence)
- [X] T0*37 [US2] Implement ttl() method in packages/maintenance/src/cache/operations.ts (returns -2 for missing, -1 for no expiry, >=0 for remaining seconds)
- [X] T0*38 [US2] Add JSON serialization error handling in packages/maintenance/src/cache/operations.ts (returns SERIALIZATION_ERROR)
- [X] T0*39 [US2] Add JSON deserialization error handling in packages/maintenance/src/cache/operations.ts (returns DESERIALIZATION_ERROR)
- [X] T0*40 [US2] Add Redis connection error handling in packages/maintenance/src/cache/operations.ts (returns REDIS_UNAVAILABLE)
- [X] T0*41 [US2] Implement healthCheck() method in packages/maintenance/src/cache/operations.ts (measures latency, returns ok + latencyMs)
- [X] T0*42 [US2] Export CacheClient from packages/maintenance/src/index.ts
- [X] T0*43 [US2] Create singleton cache client instance in packages/maintenance/src/cache/client-instance.ts for reuse across apps
- [X] T0*44 [US2] Export singleton instance from packages/maintenance/src/index.ts

**Checkpoint**: At this point, User Story 2 should be fully functional - cache operations are type-safe and reusable across all apps

**Validation** (per quickstart.md):
- Try invalid types in cache calls → verify compilation fails
- Store typed data → retrieve → verify type matches
- Disconnect Redis → attempt operation → verify typed error returned
- Run health check → verify < 50ms response

---

## Phase 5: User Story 3 - Real-Time Event Communication (Priority: P3)

**Goal**: Enable decoupled event communication between web and API services via Redis Pub/Sub

**Independent Test**:
1. Start subscriber in API service listening to test channel
2. Publish typed event from web server action
3. Verify subscriber receives event within 100ms
4. Verify message structure matches PubSubEnvelope schema
5. Publish to channel with no subscribers → verify succeeds (fire-and-forget)

### Implementation for User Story 3

- [X] T0*45 [P] [US3] Create channel naming convention documentation in packages/maintenance/src/pubsub/README.md (domain.entity.action format)
- [X] T0*46 [P] [US3] Define channel registry type in packages/maintenance/src/pubsub/channels.ts (maps channel names to payload types)
- [X] T0*47 [P] [US3] Define PubSubPublisher interface in packages/maintenance/src/pubsub/types.ts following pubsub-contract.md
- [X] T0*48 [P] [US3] Define PubSubSubscriber interface in packages/maintenance/src/pubsub/types.ts following pubsub-contract.md
- [X] T0*49 [US3] Implement PubSubPublisher class in packages/maintenance/src/pubsub/publisher.ts
- [X] T0*50 [US3] Implement publish<TPayload>() method in packages/maintenance/src/pubsub/publisher.ts (publishes PubSubEnvelope to channel)
- [X] T0*51 [US3] Add messageId generation in packages/maintenance/src/pubsub/publisher.ts (unique ID per message)
- [X] T0*52 [US3] Add timestamp generation in packages/maintenance/src/pubsub/publisher.ts (ISO 8601 format)
- [X] T0*53 [US3] Add producer field population in packages/maintenance/src/pubsub/publisher.ts (web/api/worker)
- [X] T0*54 [US3] Implement PubSubSubscriber class in packages/maintenance/src/pubsub/subscriber.ts
- [X] T0*55 [US3] Implement subscribe<TPayload>() method in packages/maintenance/src/pubsub/subscriber.ts (registers handler, returns unsubscribe function)
- [X] T0*56 [US3] Add message deserialization in packages/maintenance/src/pubsub/subscriber.ts (parses PubSubEnvelope)
- [X] T0*57 [US3] Add malformed message handling in packages/maintenance/src/pubsub/subscriber.ts (logs and drops invalid messages)
- [X] T0*58 [US3] Add subscriber error handling in packages/maintenance/src/pubsub/subscriber.ts (catches handler errors, continues processing)
- [X] T0*59 [US3] Implement unsubscribe() function in packages/maintenance/src/pubsub/subscriber.ts (cleans up channel subscription)
- [X] T0*60 [US3] Export PubSubPublisher and PubSubSubscriber from packages/maintenance/src/index.ts
- [X] T0*61 [US3] Create example event schemas in packages/maintenance/src/pubsub/channels.ts (chat.message.sent, user.status.changed)
- [X] T0*62 [US3] Document fire-and-forget semantics in packages/maintenance/src/pubsub/README.md (no delivery guarantees, no persistence in v1)
- [X] T0*63 [US3] Create singleton publisher instance in packages/maintenance/src/pubsub/instances.ts
- [X] T0*64 [US3] Create singleton subscriber instance in packages/maintenance/src/pubsub/instances.ts
- [X] T0*65 [US3] Export singleton instances from packages/maintenance/src/index.ts

**Checkpoint**: All user stories should now be independently functional - Pub/Sub enables real-time communication between services

**Validation** (per quickstart.md):
- Subscribe to channel → publish event → verify delivery < 100ms
- Publish with invalid structure → verify compilation fails
- Multiple subscribers on same channel → publish → verify all receive event
- Publish to empty channel → verify succeeds without error

---

## Phase 6: Integration & Documentation

**Purpose**: Connect all pieces and document usage patterns

- [X] T0*66 [P] Create example usage in apps/web/src/services/cache-example.ts (demonstrates cache operations)
- [X] T0*67 [P] Create example publisher in apps/web/src/services/event-publisher.ts (demonstrates event publishing)
- [X] T0*68 [P] Create example subscriber in apps/api/src/subscribers/event-subscriber.ts (demonstrates event subscription)
- [X] T0*69 [P] Update packages/maintenance/README.md with Redis setup instructions
- [X] T0*70 [P] Document cache client usage patterns in packages/maintenance/README.md
- [X] T0*71 [P] Document session store integration with NextAuth in packages/maintenance/README.md
- [X] T0*72 [P] Document Pub/Sub usage patterns and channel conventions in packages/maintenance/README.md
- [X] T0*73 Add initialization code in apps/web/src/lib/redis-init.ts (establishes connections on startup)
- [X] T0*74 Add initialization code in apps/api/src/lib/redis-init.ts (establishes connections on startup)
- [X] T0*75 Update apps/web/src/app/layout.tsx to initialize Redis connections
- [X] T0*76 Update apps/api/src/index.ts to initialize Redis connections and subscribers

**Checkpoint**: Integration complete, ready for validation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [X] T0*77 [P] Add connection pool configuration in packages/maintenance/src/cache/config.ts (maxRetriesPerRequest, retryStrategy)
- [X] T0*78 [P] Add graceful shutdown handlers in packages/maintenance/src/cache/redis-client.ts
- [X] T0*79 [P] Add connection state monitoring in packages/maintenance/src/cache/redis-client.ts (ready, connecting, error events)
- [X] T0*80 [P] Add logging for cache operations in packages/maintenance/src/cache/operations.ts (debug level)
- [X] T0*81 [P] Add logging for session operations in packages/maintenance/src/auth/redis/session-store.ts (info level)
- [X] T0*82 [P] Add logging for Pub/Sub operations in packages/maintenance/src/pubsub/ (debug level for publish, info for subscribe/unsubscribe)
- [X] T0*83 [P] Add metrics/observability hooks in packages/maintenance/src/cache/operations.ts (operation counts, latencies)
- [X] T0*84 Add TypeScript strict mode compliance checks across packages/maintenance/src/
- [X] T0*85 Run quickstart.md validation for User Story 1 (session persistence)
- [X] T0*86 Run quickstart.md validation for User Story 2 (cache type safety)
- [X] T0*87 Run quickstart.md validation for User Story 3 (Pub/Sub delivery)
- [X] T0*88 Verify all success criteria from spec.md (session reliability, performance targets, type safety)
- [X] T0*89 Document edge cases and error scenarios in packages/maintenance/README.md (Redis unavailable, corrupted data, memory limits)
- [X] T0*90 [P] Implement Redis security configuration in packages/maintenance/src/redis/client.ts (password auth, TLS, env-conditional per plan.md Security Considerations)

**Checkpoint**: Feature complete, validated against all acceptance criteria, and production-ready with security configuration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Phase 2 - No dependencies on other stories
  - User Story 2 (P2): Can start after Phase 2 - Independent of US1 but recommended after for better testing
  - User Story 3 (P3): Can start after Phase 2 - Independent but leverages US2 cache client
- **Integration (Phase 6)**: Depends on desired user stories being complete
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - **No dependencies on other stories** ✅ MVP-ready
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - **Independent, can run in parallel with US1**
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - **Independent, recommended after US2 for better cache client reuse**

### Within Each User Story

**User Story 1 (Sessions)**:
- T016-T017: Type definitions (parallel)
- T018: Session store class (depends on types)
- T019-T022: CRUD methods (depends on T018, can be sequential or one-by-one)
- T023: Error handling (depends on CRUD methods)
- T024: Export (depends on implementation complete)
- T025-T028: NextAuth integration (depends on T024, sequential)

**User Story 2 (Cache)**:
- T030-T031: Type definitions (parallel)
- T032: Cache client class (depends on types)
- T033-T037: Operation methods (depends on T032, can be done one-by-one)
- T038-T040: Error handling (parallel with operations)
- T041: Health check (depends on client class)
- T042-T044: Export and singleton (depends on complete implementation)

**User Story 3 (Pub/Sub)**:
- T046-T048: Documentation and type definitions (parallel)
- T050-T053: Publisher implementation (sequential, depends on types)
- T055-T059: Subscriber implementation (sequential, depends on types, can be parallel with publisher)
- T061-T065: Export and instances (depends on complete implementation)

### Parallel Opportunities

#### Phase 1: Setup
- T003 and T004 can run in parallel (different files)

#### Phase 2: Foundational
- T009, T010, T011 can run in parallel (different type files)

#### Phase 3: User Story 1
- T016 and T017 can run in parallel (same file but independent type definitions)

#### Phase 4: User Story 2
- T030 and T031 can run in parallel (same file but independent type definitions)
- T038, T039, T040 can be written in parallel with operation methods

#### Phase 5: User Story 3
- T045, T045, T046, T047 can run in parallel (different concerns)
- Publisher (T049-T052) and Subscriber (T053-T058) can be built in parallel by different developers

#### Phase 6: Integration
- T066, T066, T067, T068, T069, T070, T071 can all run in parallel (different files)

#### Phase 7: Polish
- T077, T077, T078, T079, T080, T081, T082 can all run in parallel (different files/concerns)

---

## Parallel Example: User Story 3 (Pub/Sub)

```bash
# Developer A builds Publisher:
Task T049-T052: Implement PubSubPublisher class and publish method

# Developer B builds Subscriber (in parallel):
Task T054-T058: Implement PubSubSubscriber class and subscribe method

# Once both complete:
Task T060-T064: Export and create singleton instances
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - **RECOMMENDED**

1. ✅ Complete Phase 1: Setup (install dependencies, configure environment)
2. ✅ Complete Phase 2: Foundational (Redis client, config, base types) - **CRITICAL**
3. ✅ Complete Phase 3: User Story 1 (session persistence)
4. ✅ **STOP and VALIDATE**: Test session persistence per quickstart.md
   - Authenticate → restart → verify session valid
   - Multiple instances → verify session shared
5. 🎯 **Deploy/demo MVP** - Sessions now persist across restarts!

### Incremental Delivery

1. **Foundation** (Phase 1 + 2): Redis infrastructure ready
2. **Increment 1** (Phase 3): Sessions persist → Test → Deploy (MVP!) 🎯
3. **Increment 2** (Phase 4): Type-safe cache available → Test → Deploy
4. **Increment 3** (Phase 5): Real-time events working → Test → Deploy
5. **Increment 4** (Phase 6 + 7): Integration examples + polish → Deploy

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

**Week 1**: Team completes Setup + Foundational together (critical path)

**Week 2**: Once Foundational is done, parallel work:
- Developer A: User Story 1 (Sessions) - **MVP priority**
- Developer B: User Story 2 (Cache Library)
- Developer C: User Story 3 Prep (Pub/Sub types and documentation)

**Week 3**: Integration and validation
- Developer A: Validates US1 per quickstart.md, prepares examples
- Developer B: Validates US2, helps with US3
- Developer C: Completes US3 implementation

**Week 4**: Polish and finalization
- All developers: Phase 6 integration tasks (parallel)
- All developers: Phase 7 polish tasks (parallel)
- Final validation against success criteria

---

## Notes

### Task Format
- `[P]` tasks = different files, no dependencies on incomplete tasks
- `[Story]` label maps task to specific user story for traceability
- Each user story is independently completable and testable
- File paths are concrete and absolute from repository root

### Best Practices
- Commit after each logical task or group of related tasks
- Stop at checkpoints to validate story independently
- Run quickstart.md scenarios at each major milestone
- Verify type safety with compilation checks
- Test Redis failure scenarios (disconnect, timeout)

### Common Pitfalls to Avoid
- ❌ Skipping Foundational phase validation
- ❌ Making session store depend on Pub/Sub (keep independent)
- ❌ Implementing all three stories before testing any
- ❌ Not testing Redis unavailability scenarios
- ❌ Forgetting to export new types/classes from package index
- ❌ Hardcoding Redis configuration (use environment variables)
- ❌ Not documenting channel naming conventions

### Success Metrics (from spec.md)
- ✅ Sessions persist with 100% reliability through restarts
- ✅ Session lookups < 10ms for 95% of requests
- ✅ Health checks respond < 50ms
- ✅ Pub/Sub message delivery < 100ms
- ✅ Supports 1000+ concurrent sessions without degradation
- ✅ All cache operations are type-safe (caught at compilation)
- ✅ Zero auth errors from session store during normal operation

---

## Total Task Count

- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 10 tasks  
- **Phase 3 (User Story 1)**: 14 tasks (+1 logout flow = T029)
- **Phase 4 (User Story 2)**: 15 tasks (T030-T044)
- **Phase 5 (User Story 3)**: 21 tasks (T045-T065)
- **Phase 6 (Integration)**: 11 tasks (T066-T076)
- **Phase 7 (Polish)**: 14 tasks (+1 security = T090)

**Total**: 90 tasks (88 original + T029 logout + T090 security)

**MVP Scope** (recommended first delivery): Phase 1 + Phase 2 + Phase 3 = 29 tasks

**Parallel Opportunities**: 15+ tasks can be executed in parallel at various phases

**Independent Test Criteria**:
- User Story 1: Session persistence across restarts ✅
- User Story 2: Type-safe cache operations with error handling ✅
- User Story 3: Real-time event delivery under 100ms ✅
