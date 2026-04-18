# Guia Rápido para Desenvolvedores: Separação WebSocket/API (EPIC-002)

**Data**: 2026-04-08  
**Branch**: `002-separacao-api`

## Visão Geral

Este guia rápido ajuda desenvolvedores a entender e trabalhar com a arquitetura separada de WebSocket/API. Após o EPIC-002 estar completo, o sistema terá:

- **apps/web** (porta 3000): Frontend Next.js + Server Actions para lógica backend
- **apps/api** (porta 4000): Serviço Hono hospedando servidor WebSocket
- **Comunicação**: Server Actions → Redis Pub/Sub → broadcasts WebSocket

---

## Pré-requisitos

Antes de iniciar o desenvolvimento:

1. **Dependências instaladas**: `pnpm install` na raiz do repositório
2. **Variáveis de ambiente configuradas**: Copie `.env.example` para `.env.local` e preencha:
   - `SURREAL_URL`, `SURREAL_USER`, `SURREAL_PASS` (conexão SurrealDB)
   - `REDIS_HOST`, `REDIS_PORT` (Redis Pub/Sub)
   - `NEXTAUTH_SECRET` (compartilhado entre apps/web e apps/api)
   - `NEXT_PUBLIC_WS_URL=http://localhost:4000` (URL WebSocket para o cliente)
3. **Serviços rodando**:
   - SurrealDB: `docker-compose up -d surrealdb` (porta 8000)
   - Redis: `docker-compose up -d redis` (porta 6379)

---

## Executando a Aplicação

### Modo de Desenvolvimento (Recomendado)

Execute ambas as apps simultaneamente com hot reload:

```bash
# Da raiz do repositório
pnpm dev
```

Isto inicia:
- apps/web em http://localhost:3000 (Next.js + Server Actions)
- apps/api em http://localhost:4000 (Hono + WebSocket)
- apps/workers (jobs em background)

**O que acontece**:
- Next.js executa em modo padrão (sem servidor customizado)
- Hono serve WebSocket na porta 4000
- Redis Pub/Sub conecta ambos os serviços
- Mudanças em arquivos disparam hot reload

### Executando Individualmente

**apps/web apenas** (frontend + Server Actions):
```bash
cd apps/web
pnpm dev
```

**apps/api apenas** (servidor WebSocket):
```bash
cd apps/api
pnpm dev
```

**Nota**: Ambos devem estar rodando para funcionalidade completa. Server Actions funcionam sem apps/api, mas sem atualizações em tempo real.

---

## Referência Rápida de Arquitetura

### Fluxo de Comunicação

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                             │
│  - React components                                              │
│  - WebSocket client (socket.io-client)                           │
└────────┬────────────────────────────────────────┬────────────────┘
         │                                        │
         │ Server Actions (mutations)             │ WebSocket (real-time)
         │                                        │
         ▼                                        ▼
┌─────────────────────┐                  ┌─────────────────────────┐
│   apps/web:3000     │                  │    apps/api:4000        │
│   Next.js 16        │                  │    Hono 4.12            │
│                     │                  │                         │
│  - Server Actions   │                  │  - Socket.io server     │
│  - NextAuth         │                  │  - JWT middleware       │
│  - React UI         │                  │  - Event subscribers    │
└──────────┬──────────┘                  └──────────┬──────────────┘
           │                                        │
           │ Publish events                         │ Subscribe to events
           ▼                                        ▼
     ┌─────────────────────────────────────────────────┐
     │         Redis Pub/Sub (port 6379)               │
     │  Channels:                                      │
     │  - chat.message.sent                            │
     │  - room.member.joined                           │
     │  - user.presence.changed                        │
     └─────────────────────────────────────────────────┘
                           │
                           ▼
     ┌─────────────────────────────────────────────────┐
     │        SurrealDB (port 8000)                    │
     │  Tables: users, salas, messages, assistants     │
     └─────────────────────────────────────────────────┘
```

---

## Tarefas Comuns de Desenvolvimento

### 1. Criando uma Nova Server Action

**Localização**: `apps/web/src/lib/actions/*.ts`

**Template**:
```typescript
'use server'

import { auth } from '@/auth'
import { getPublisher } from '@synergy/platform'
import { z } from 'zod'

// Definir schema de entrada
const MyActionSchema = z.object({
  field: z.string().min(1),
})

export async function myAction(formData: FormData) {
  const correlationId = crypto.randomUUID()
  
  // 1. Autenticar
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    }
  }
  
  // 2. Validar entrada
  const validatedFields = MyActionSchema.safeParse({
    field: formData.get('field'),
  })
  
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { field } = validatedFields.data
  
  // 3. Execute business logic (save to DB)
  try {
    const result = await repository.create({ field, userId: session.user.id })
    
    // 4. Publish event to Redis (optional)
    try {
      const publisher = getPublisher()
      await publisher.publish('domain.entity.event', {
        ...result,
        correlationId,
      })
    } catch (redisError) {
      console.error('Redis publish failed', { correlationId, error: redisError })
      // Continuar - degradação graciosa
    }
    
    // 5. Return success
    return {
      success: true,
      data: result,
      correlationId,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Action failed', { correlationId, error })
    return {
      success: false,
      error: 'Internal error',
      code: 'INTERNAL_ERROR',
    }
  }
}
```

**Type Safety**: Define return type in `@synergy/types` if used across packages.

---

### 2. Inscrevendo-se em Eventos Redis no apps/api

**Localização**: `apps/api/src/subscribers/event-subscriber.ts`

**Adicionar uma nova assinatura**:
```typescript
import { getSubscriber } from '@synergy/platform'
import type { PubSubEnvelope } from '@synergy/platform'

// Definir tipo do payload
interface MyEventPayload {
  entityId: string
  userId: string
  correlationId: string
}

export async function subscribeToMyEvent(): Promise<() => void> {
  const subscriber = getSubscriber()
  
  const unsubscribe = await subscriber.subscribe<MyEventPayload>(
    'domain.entity.event',
    async (envelope: PubSubEnvelope<MyEventPayload>) => {
      console.log('[API] Received event:', envelope.type, envelope.payload)
      
      // Broadcast para clientes WebSocket
      io.of('/namespace').to('room').emit('event:name', envelope.payload)
      
      // Log com correlation ID
      logger.info('Event processed', {
        correlationId: envelope.correlationId,
        entityId: envelope.payload.entityId,
      })
    }
  )
  
  console.log('[API] Subscribed to domain.entity.event')
  return unsubscribe
}

// Adicionar ao subscribeToAllEvents():
export async function subscribeToAllEvents(): Promise<() => void> {
  const unsubscribes = await Promise.all([
    // ... assinaturas existentes
    subscribeToMyEvent(),
  ])
  
  return async () => {
    for (const unsubscribe of unsubscribes) {
      await unsubscribe()
    }
  }
}
```

---

### 3. Adicionando um Novo Evento WebSocket

**Localização**: `apps/api/src/websocket/namespaces/*.ts`

**Exemplo** (adicionar ao namespace `/chat`):
```typescript
// apps/api/src/websocket/namespaces/chat.ts
import { Server, Socket } from 'socket.io'
import { sessionMiddleware } from '../middleware/session'

export function configureChatNamespace(io: Server) {
  const chatNs = io.of('/chat')
  
  // Apply authentication middleware
  chatNs.use(sessionMiddleware)
  
  chatNs.on('connection', (socket: Socket) => {
    console.log('Client connected to /chat', socket.data.userId)
    
    // Handle client events
    socket.on('my:event', async (data) => {
      console.log('Received my:event', data)
      
      // Validate user is in room
      const hasAccess = await checkRoomAccess(socket.data.userId, data.roomId)
      if (!hasAccess) {
        socket.disconnect(true)
        return
      }
      
      // Broadcast to room
      socket.to(`room:${data.roomId}`).emit('my:response', {
        ...data,
        userId: socket.data.userId,
      })
    })
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from /chat', socket.data.userId)
    })
  })
}
```

**Client-side usage**:
```typescript
const socket = io('http://localhost:4000/chat', {
  auth: { token: session.accessToken }
})

socket.emit('my:event', { roomId: 'room:123', data: 'value' })

socket.on('my:response', (data) => {
  console.log('Received response:', data)
})
```

---

### 4. Usando Server Actions em Componentes React

**Componente Cliente**:
```typescript
'use client'

import { useFormState } from 'react-dom'
import { myAction } from '@/lib/actions/my-actions'

export function MyForm() {
  const [state, formAction] = useFormState(myAction, null)
  
  return (
    <form action={formAction}>
      <input name="field" placeholder="Digite um valor" />
      
      {state && !state.success && (
        <div className="error">{state.error}</div>
      )}
      
      {state && state.success && (
        <div className="success">Sucesso! ID: {state.data.id}</div>
      )}
      
      <button type="submit">Enviar</button>
    </form>
  )
}
```

**Com Atualizações Otimistas**:
```typescript
'use client'

import { useOptimistic } from 'react'
import { sendMessage } from '@/lib/actions/messages'

export function ChatMessages({ initialMessages, roomId }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state, newMessage) => [...state, newMessage]
  )
  
  async function handleSend(formData: FormData) {
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: formData.get('content'),
      userId: session.user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    
    // Mostrar imediatamente na UI
    addOptimisticMessage(tempMessage)
    
    // Enviar para o servidor
    const result = await sendMessage(formData)
    
    if (!result.success) {
      toast.error(result.error)
    }
  }
  
  return (
    <div>
      {optimisticMessages.map(msg => (
        <Message key={msg.id} {...msg} isPending={msg.status === 'pending'} />
      ))}
    </div>
  )
}
```

---

### 5. Conectando ao WebSocket no React

**Hook**:
```typescript
// apps/web/src/hooks/use-websocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

export function useWebSocket(namespace: string) {
  const { data: session } = useSession()
  const [socket, definidoSocket] = useState<Socket | null>(null)
  const [connected, definidoConnected] = useState(false)
  
  useEffect(() => {
    if (!session?.accessToken) return
    
    const ws = io(`${process.env.NEXT_PUBLIC_WS_URL}${namespace}`, {
      auth: { token: session.accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMáximo: 5000,
    })
    
    ws.on('connect', () => definidoConnected(true))
    ws.on('disconnect', () => definidoConnected(false))
    
    definidoSocket(ws)
    
    return () => {
      ws.close()
    }
  }, [namespace, session])
  
  return { socket, connected }
}
```

**Componente**:
```typescript
'use client'

export function ChatRoom({ roomId }) {
  const { socket, connected } = useWebSocket('/chat')
  const [messages, definidoMessages] = useState([])
  
  useEffect(() => {
    if (!socket || !connected) return
    
    socket.emit('room:join', { roomId })
    
    socket.on('message:new', (data) => {
      definidoMessages(prev => [...prev, data])
    })
    
    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('message:new')
    }
  }, [socket, connected, roomId])
  
  return (
    <div>
      <div>Status: {connected ? '🟢 Online' : '🔴 Offline'}</div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  )
}
```

---

## Testes

### Testando Server Actions

```typescript
// apps/web/src/lib/actions/__tests__/messages.test.ts
import { sendMessage } from '../messages'
import { auth } from '@/auth'

jest.mock('@/auth')
jest.mock('@synergy/platform')

describe('sendMessage', () => {
  it('deve requerer autenticação', async () => {
    (auth as jest.Mock).mockResolvedValue(null)
    
    const formData = new FormData()
    formData.set('roomId', 'room:123')
    formData.set('content', 'Hello')
    
    const result = await sendMessage(formData)
    
    expect(result.success).toBe(false)
    expect(result.code).toBe('UNAUTHORIZED')
  })
})
```

### Testando Eventos WebSocket

```typescript
// apps/api/src/websocket/__tests__/chat.test.ts
import { io as Client } from 'socket.io-client'
import { createServer } from '../server'

describe('Chat namespace', () => {
  let server, clientSocket
  
  beforeAll((done) => {
    server = createServer()
    server.listen(4001, done)
  })
  
  afterAll(() => {
    server.close()
  })
  
  it('deve fazer broadcast de mensagens para membros da sala', (done) => {
    clientSocket = Client('http://localhost:4001/chat', {
      auth: { token: 'valid-jwt-token' }
    })
    
    clientSocket.on('message:new', (data) => {
      expect(data.content).toBe('Hello')
      done()
    })
    
    clientSocket.emit('room:join', { roomId: 'room:123' })
    
    // Simular Server Action publicando no Redis
    publisher.publish('chat.message.sent', {
      messageId: 'msg:1',
      roomId: 'room:123',
      content: 'Hello',
    })
  })
})
```

---

## Depuração

### Depuração de Server Actions

**Habilitar logging**:
```typescript
// apps/web/src/lib/actions/messages.ts
export async function sendMessage(formData: FormData) {
  const correlationId = crypto.randomUUID()
  
  console.log('[Server Action] sendMessage started', {
    correlationId,
    roomId: formData.get('roomId'),
  })
  
  // ... action logic
  
  console.log('[Server Action] sendMessage completed', {
    correlationId,
    success: true,
  })
}
```

**Ver logs**:
```bash
# Logs do apps/web (Next.js)
cd apps/web && pnpm dev
# Procure por entradas "[Server Action]"
```

### Depuração de WebSocket

**Habilitar logs de debug do Socket.io**:
```bash
# Em apps/api/.env.local
DEBUG=socket.io:*

# Ou ao executar:
DEBUG=socket.io:* pnpm dev
```

**Debug no cliente**:
```typescript
const socket = io('http://localhost:4000/chat', {
  auth: { token },
  transports: ['websocket', 'polling'], // Tentar polling se websocket falhar
})

socket.onAny((event, ...args) => {
  console.log('[WebSocket]', event, args)
})

socket.on('connect_error', (err) => {
  console.error('[WebSocket] Erro de conexão:', err.message)
})
```

### Depuração de Redis Pub/Sub

**Monitorar eventos Redis**:
```bash
# Conectar ao Redis CLI
redis-cli

# Inscrever-se em todos os canais
PSUBSCRIBE *

# Você verá todos os eventos publicados em tempo real
```

**Ver eventos publicados no código**:
```typescript
// apps/api/src/subscribers/event-subscriber.ts
subscriber.subscribe('*', (envelope) => {
  console.log('[Redis] Evento recebido', {
    channel: envelope.channel,
    type: envelope.type,
    correlationId: envelope.correlationId,
  })
})
```

### Rastreamento de Correlation ID

**Rastrear uma operação fim-a-fim**:

1. Cliente envia mensagem (obter correlation ID da resposta)
2. Buscar logs por esse correlation ID:

```bash
# Nos logs do apps/web
grep "550e8400-e29b-41d4-a716-446655440000" logs/web.log

# Nos logs do apps/api
grep "550e8400-e29b-41d4-a716-446655440000" logs/api.log
```

**Resultado**: Ver fluxo completo de Server Action → Redis → WebSocket

---

## Variáveis de Ambiente

### apps/web (.env.local)

```bash
# Database
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_NAMESPACE=multi_llm_chat
SURREAL_DATABASE=chat
SURREAL_USER=root
SURREAL_PASS=root

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here  # MUST match apps/api

# WebSocket (client-side)
NEXT_PUBLIC_WS_URL=http://localhost:4000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### apps/api (.env.local)

```bash
# Database
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_NAMESPACE=multi_llm_chat
SURREAL_DATABASE=chat
SURREAL_USER=root
SURREAL_PASS=root

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Auth (for JWT validation)
NEXTAUTH_SECRET=your-secret-here  # MUST match apps/web

# Server
PORT=4000
```

**Crítico**: `NEXTAUTH_SECRET` must be identical in both apps for JWT validation to work.

---

## Problemas Comuns

### Issue: WebSocket connection fails with "Invalid token"

**Causa**: JWT token invalid or `NEXTAUTH_SECRET` mismatch

**Correção**:
1. Check that `NEXTAUTH_SECRET` is identical in apps/web and apps/api
2. Verify session token is being passed: `socket.auth.token`
3. Check token expiry (default NextAuth JWT expires in 30 days)

### Issue: Server Action saves data but no WebSocket broadcast

**Causa**: Redis Pub/Sub not working or apps/api not running

**Correção**:
1. Check Redis is running: `redis-cli ping` (should return "PONG")
2. Check apps/api is running on port 4000
3. Check apps/api subscribed to events: look for "[API] Subscribed to..." logs
4. Verify Redis connection: `apps/api` should log "Redis initialized successfully"

### Issue: "Module not found" errors in Server Actions

**Causa**: Importing client-only code in Server Actions

**Correção**:
- Server Actions can only import server-side code
- Don't import React hooks or client components
- Move shared logic to packages or separate server utils

### Issue: Optimistic updates don't revert on error

**Causa**: Component not re-rendering after Server Action error

**Correção**:
- Use `revalidatePath()` in Server Actions to trigger re-fetch:
```typescript
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
  // ... action logic
  
  if (!success) {
    revalidatePath(`/salas/${roomId}`)
    return { success: false, error }
  }
}
```

---

## Dicas de Performance

### 1. Batch Redis Publishes

If publishing multiple events, use a transaction:

```typescript
const publisher = getPublisher()
const pipeline = publisher.pipeline()

pipeline.publish('event1', data1)
pipeline.publish('event2', data2)
pipeline.publish('event3', data3)

await pipeline.exec()
```

### 2. Debounce WebSocket Events

For high-frequency events (typing indicadors), debounce on client:

```typescript
import { debounce } from 'lodash'

const emitTyping = debounce(() => {
  socket.emit('typing:start', { roomId })
}, 3000, { leading: true, trailing: false })

// Call on every keystroke
input.addEventListener('input', emitTyping)
```

### 3. Use React Server Components

Fetch initial data in Server Components (no client-side fetch):

```typescript
// app/salas/[id]/page.tsx
export default async function RoomPage({ params }) {
  // This runs on the server, no client bundle bloat
  const messages = await listMessages(params.id)
  
  return <ChatMessages initialMessages={messages} roomId={params.id} />
}
```

---

## Próximos Passos

1. **Read the contracts**:
   - [WebSocket API](./contracts/websocket-api.md)
   - [Server Actions API](./contracts/server-actions-api.md)
   - [Redis Events](./contracts/redis-events.md)

2. **Explore the codebase**:
   - `apps/web/src/lib/actions/` - Server Actions
   - `apps/api/src/websocket/` - WebSocket handlers
   - `apps/api/src/subscribers/` - Redis subscribers
   - `packages/maintenance/src/pubsub/` - Pub/Sub infrastructure

3. **Run the application**:
   ```bash
   pnpm dev
   ```

4. **Test a flow**:
   - Open http://localhost:3000
   - Create a room
   - Send a message
   - Open room in another tab/browser
   - Verify entrega em tempo real

---

## Suporte

- **Documentation**: Ver `contracts/` folder for API specifications
- **Issues**: Check GitHub issues for known problems
- **Logs**: Enable debug logging as shown in "Debugging" section
- **Correlation IDs**: Include in bug reports for faster investigation

Bom desenvolvimento! 🚀
