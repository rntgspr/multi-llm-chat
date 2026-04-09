# Recomendações de Arquitetura - Multi-LLM Chat
**Data:** Abril 2025  
**Escopo:** Melhorias arquiteturais para escalabilidade e manutenibilidade

---

## 🏗️ Estrutura Atual (3-Layer Model)

```
┌─────────────────────────────────────────────────────────┐
│  apps/web (Next.js Frontend + API routes)              │
└─────────────────────────────────────────────────────────┘
           ↓ imports
┌─────────────────────────────────────────────────────────┐
│  packages/                                               │
│  ├── @multi-llm/interaction   (Chat, MessageBus)        │
│  ├── @multi-llm/interpretation (Navigator, LLM routing) │
│  ├── @multi-llm/maintenance   (Auth, Users, Rooms)      │
│  └── @multi-llm/types         (Shared types)            │
└─────────────────────────────────────────────────────────┘
           ↓ uses
┌─────────────────────────────────────────────────────────┐
│  apps/api (Hono server - partially implemented)         │
│  apps/workers (Background jobs - placeholder)           │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Problemas Identificados

### 1. **Camada API Incompleta**
- `apps/api/src/index.ts` tem apenas `/health` e `/` routes
- Repositories existem mas não estão expostos via HTTP
- WebSocket code está em `apps/web`, deveria estar em `apps/api`

### 2. **Acoplamento Frontend-Backend**
- `apps/web` importa diretamente de `packages/` (ok)
- MAS `apps/web/src/services/` duplica lógica que deveria estar em `packages/`
- Não há gateway/API layer entre frontend e backend

### 3. **Falta de Abstração em I/O**
- Database, LLM, WebSocket são utilizados diretamente pelos packages
- Sem inversion of control - packages depend on concrete implementations
- Difícil testar sem containers/mocks completos

### 4. **Escalabilidade Comprometida**
- Session storage em memória (`packages/maintenance/src/auth/session.ts`)
- MessageBus é singleton em memória
- Sem mecanismo para múltiplas instâncias de servidor

---

## 🎯 Recomendações

### R1. Completar Camada API (`apps/api`)

**Objetivo:** Mover toda lógica de backend da web para API, deixando web como cliente puro

**Estrutura proposta:**
```
apps/api/
├── src/
│   ├── index.ts              (setup Hono + middleware)
│   ├── routes/
│   │   ├── auth.ts          (POST /auth/login, /auth/logout)
│   │   ├── users.ts         (GET /users/:id, POST /users)
│   │   ├── rooms.ts         (GET /rooms, POST /rooms/:id/messages)
│   │   ├── messages.ts      (GET /messages, POST /messages)
│   │   └── health.ts        (GET /health com assistants status)
│   ├── middleware/
│   │   ├── auth.ts          (validar JWT)
│   │   ├── error-handler.ts
│   │   └── logging.ts
│   ├── websocket/
│   │   ├── handlers.ts      (MOVE from apps/web!)
│   │   └── middleware.ts
│   └── lib/
│       └── validation.ts    (Zod schemas para requests)
```

**Implementação:**
```typescript
// apps/api/src/routes/rooms.ts
import { Hono } from 'hono'
import { rolesRepository } from '@multi-llm/db/repositories'
import { createUserInputSchema } from '../lib/validation'

const rolesRouter = new Hono()

rolesRouter.get('/', async (c) => {
  const rooms = await roomRepository.findAll()
  return c.json(rooms)
})

rolesRouter.post('/:roomId/messages', async (c) => {
  const roomId = c.req.param('roomId')
  const body = await c.req.json()
  
  // Validate
  const validated = createUserInputSchema.parse(body)
  
  // Process
  const message = await messageRepository.create({
    roomId,
    ...validated
  })
  
  return c.json(message, 201)
})

export default rolesRouter
```

**Benefícios:**
- ✅ Camada API completa e independente
- ✅ Frontend é apenas cliente HTTP (testável, reusável)
- ✅ Preparado para múltiplos clientes (mobile, CLI, etc)
- ✅ Pode escalar independentemente da web

**Esforço:** ~16 horas (2 dias)

---

### R2. Implementar Dependency Injection

**Objetivo:** Desacoplar packages de implementações concretas

**Padrão proposto:**
```typescript
// packages/core/src/types.ts
export interface IDatabase {
  execute(sql: string, params?: Record<string, any>): Promise<any[]>
  // ... methods
}

export interface ILogger {
  info(msg: string): void
  error(msg: string, err?: Error): void
}

export interface ICache {
  get(key: string): Promise<any>
  set(key: string, value: any, ttl?: number): Promise<void>
}

// packages/maintenance/src/users/user-manager.ts
export class UserManager {
  constructor(
    private db: IDatabase,
    private cache: ICache,
    private logger: ILogger
  ) {}
  
  async getUser(userId: string) {
    // Use abstraction, not concrete SurrealDB
    const cached = await this.cache.get(`user:${userId}`)
    if (cached) return cached
    
    const user = await this.db.execute('SELECT * FROM user WHERE id = $id', { id: userId })
    await this.cache.set(`user:${userId}`, user)
    return user
  }
}

// apps/api/src/index.ts - wire up dependencies
import { SurrealDBAdapter } from './adapters/surrealdb'
import { RedisCache } from './adapters/redis'
import { ConsoleLogger } from './adapters/logger'

const db = new SurrealDBAdapter()
const cache = new RedisCache()
const logger = new ConsoleLogger()

const userManager = new UserManager(db, cache, logger)
```

**Benefícios:**
- ✅ Testável - inject mocks
- ✅ Flexível - trocar DB sem mudar packages
- ✅ Extensível - novos adapters sem refactor

**Esforço:** ~24 horas (refactor gradual)

---

### R3. Implementar Event-Driven Architecture

**Objetivo:** Desacoplar componentes via eventos

**Padrão proposto:**
```typescript
// packages/core/src/events.ts
export type ChatEvent = 
  | { type: 'message-sent'; roomId: string; message: Message }
  | { type: 'assistant-started'; roomId: string; assistantId: AssistantId }
  | { type: 'assistant-token'; roomId: string; token: string }
  | { type: 'user-joined'; roomId: string; userId: UserId }
  | { type: 'user-left'; roomId: string; userId: UserId }

export interface EventBus {
  publish(event: ChatEvent): Promise<void>
  subscribe(handler: (event: ChatEvent) => void): () => void
  subscribeToType<T extends ChatEvent['type']>(
    type: T,
    handler: (event: Extract<ChatEvent, { type: T }>) => void
  ): () => void
}

// Implementation: Redis PubSub (replace in-memory MessageBus)
export class RedisPubSubEventBus implements EventBus {
  async publish(event: ChatEvent) {
    await redis.publish('chat-events', JSON.stringify(event))
  }
  
  subscribe(handler: (event: ChatEvent) => void) {
    const unsubscribe = redis.on('message', (channel, message) => {
      if (channel === 'chat-events') {
        handler(JSON.parse(message))
      }
    })
    return unsubscribe
  }
}

// Usage: Persist messages to DB on event
eventBus.subscribeToType('message-sent', async (event) => {
  await messageRepository.create({
    roomId: event.roomId,
    content: event.message.content,
    senderId: event.message.senderId,
    timestamp: new Date()
  })
})

// Usage: Broadcast to WebSocket on event
eventBus.subscribeToType('message-sent', (event) => {
  io.to(event.roomId).emit('new-message', event.message)
})
```

**Benefícios:**
- ✅ Componentes desacoplados
- ✅ Novo subscriber sem modificar publisher
- ✅ Persistência descentralizada (banco de dados, cache, WebSocket, etc)
- ✅ Escalável - Redis permite múltiplas instâncias

**Esforço:** ~12 horas (implementar RedisPubSubEventBus, remover MessageBus em memória)

---

### R4. Adicionar Validation Layer

**Objetivo:** Validar todos inputs em HTTP layer

**Padrão proposto:**
```typescript
// apps/api/src/lib/validation.ts
import { z } from 'zod'

export const createMessageSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  content: z.array(
    z.union([
      z.object({ type: z.literal('text'), text: z.string().min(1).max(4000) }),
      z.object({ type: z.literal('code'), language: z.string(), code: z.string() })
    ])
  ),
  visibility: z.enum(['public', 'private']).default('public')
})

export type CreateMessageRequest = z.infer<typeof createMessageSchema>

// apps/api/src/middleware/validation.ts
export const validateJson = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const validated = schema.parse(body)
      c.set('body', validated)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: 'Validation failed', details: error.errors }, 400)
      }
      throw error
    }
  }
}

// app/api/src/routes/messages.ts
import { validateJson } from '../middleware/validation'
import { createMessageSchema } from '../lib/validation'

messagesRouter.post('/', 
  validateJson(createMessageSchema),
  async (c) => {
    const body = c.get('body') as CreateMessageRequest
    // body is now guaranteed to be valid
    const message = await messageRepository.create(body)
    return c.json(message, 201)
  }
)
```

**Benefícios:**
- ✅ Segurança - rejeita dados inválidos na entrada
- ✅ Type safety - TypeScript sabe shape após validation
- ✅ Erro claro - cliente recebe schema violation details

**Esforço:** ~8 horas (criar schemas para todos endpoints)

---

### R5. Remover Session em Memória

**Objetivo:** Usar Redis para session storage (escalável)

**Padrão proposto:**
```typescript
// packages/maintenance/src/auth/redis-session-store.ts
import { Redis } from 'redis'

export class RedisSessionStore {
  constructor(private redis: Redis) {}
  
  async create(userId: UserId, expiresInHours = 24): Promise<string> {
    const token = crypto.randomUUID()
    const session = {
      userId,
      expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000
    }
    
    await this.redis.setex(
      `session:${token}`,
      expiresInHours * 60 * 60,
      JSON.stringify(session)
    )
    
    return token
  }
  
  async get(token: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${token}`)
    if (!data) return null
    
    const session = JSON.parse(data) as Session
    if (session.expiresAt < Date.now()) {
      await this.redis.del(`session:${token}`)
      return null
    }
    
    return session
  }
}

// apps/api/src/middleware/auth.ts
export const withAuth = (redis: Redis) => {
  const sessionStore = new RedisSessionStore(redis)
  
  return async (c: Context, next: Next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const session = await sessionStore.get(token)
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    c.set('userId', session.userId)
    await next()
  }
}
```

**Benefícios:**
- ✅ Escalável - múltiplas instâncias compartilham sessions
- ✅ Durável - dados persistem entre restarts
- ✅ TTL automático - Redis expira sessions automaticamente
- ✅ Descentralizado - sem estado no servidor

**Esforço:** ~4 horas (implementar + testar)

---

## 📊 Roadmap Recomendado

### Phase 1: Setup (Week 1)
- [ ] R5: Remove session em memória (Redis) - 4h
- [ ] R4: Add validation layer - 8h
- [ ] R1: Basic API routes (health, auth) - 4h
- **Total:** 16h

### Phase 2: Core Routes (Week 2)
- [ ] R1: Completar routes (users, rooms, messages) - 12h
- [ ] R4: Add validators para todos endpoints - 4h
- **Total:** 16h

### Phase 3: Architecture (Week 3)
- [ ] R2: Dependency injection - 12h
- [ ] R1: Move WebSocket para apps/api - 4h
- **Total:** 16h

### Phase 4: Event-Driven (Week 4)
- [ ] R3: Implement RedisPubSubEventBus - 12h
- [ ] R3: Replace in-memory MessageBus - 4h
- **Total:** 16h

**Total Effort:** ~64 horas (2 semanas com 1 dev, ou 1 semana com 2 devs)

---

## ✅ Benefícios Esperados

| Benefício | Impacto | Timing |
|-----------|--------|--------|
| **Escalabilidade** | Suporta múltiplas instâncias | Após R5 |
| **Testabilidade** | Componentes desacoplados | Após R2 |
| **Manutenibilidade** | Código organizado, sem duplicação | Após R1 + cleanup |
| **Confiabilidade** | Validação em camada HTTP | Após R4 |
| **Resiliência** | Eventos distribuídos, sem estado | Após R3 |

---

## 🚀 Quick Start

Se só puder fazer 1 coisa, faça:

**R5 (Redis Session Store)** - Mais alto impacto/esforço, habilita escalabilidade

Se puder fazer 2 coisas, adicione:

**R4 (Validation Layer)** - Segurança imediata, pequeno esforço

Se puder fazer 3 coisas, adicione:

**R1 (Complete API)** - Desacopla frontend do backend

---

## 📚 Referências

- **Current State:** `.specify/memory/STATUS.md`
- **Architecture Instructions:** `.github/instructions/architecture.instructions.md`
- **Critical Analysis:** `.specify/memory/tech-debt/CRITICAL-ANALYSIS-2025-04.md`

---

**Próximos passos:** Discutir priorização com Tech Lead
