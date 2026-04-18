# Contrato de Eventos Redis (Pub/Sub)

**Version**: 1.0.0  
**Date**: 2026-04-08  
**Infrastructure**: Redis Pub/Sub (ioredis 5.4.1)

## Visão Geral

Este documento define the Redis Pub/Sub event contract  para internos communication between `apps/web` (Server Actions)  e `apps/api` (WebSocket server).

Redis Pub/Sub is used as the **message bus** to decouple Server Actions from WebSocket broadcasting:

```
[apps/web: Server Action] 
  → Save to DB
  → Publish event to Redis
  → Return success to client

[apps/api: Redis Subscriber]
  → Receive event from Redis
  → Broadcast to WebSocket clients in room
```

All Redis Pub/Sub infrastructure is implemented in `@multi-llm/plat param` package.

---

## Arquitetura

### Publisher (apps/web)

Server Actions publish events after successfully saving data to the database:

```typescript
import { getPublisher } from '@multi-llm/plat param'

export async function sendMessage( paramData: FormData) {
  // 1. Save to database
  const message = await messageRepository.create({ ... })
  
  // 2. Publish to Redis
  const publisher = getPublisher()
  await publisher.publish('chat.message.sent', {
    messageId: message.id,
    roomId: message.roomId,
    userId: message.userId,
    content: message.content,
    createdAt: message.createdAt,
    correlationId: crypto.r eomUUID(),
  })
  
  // 3. Return success
  return { success: true, data: message, correlationId }
}
```

### Subscriber (apps/api)

The WebSocket server subscribes to events  e broadcasts to clients:

```typescript
import { getSubscriber } from '@multi-llm/plat param'
import type { MessageSentPayload } from '@multi-llm/plat param'

const subscriber = getSubscriber()

await subscriber.subscribe<MessageSentPayload>(
  'chat.message.sent',
  async (envelope) => {
    const { roomId, ...payload } = envelope.payload
    
    // Broadcast to all WebSocket clients in the room
    io.of('/chat').to(`room:${roomId}`).emit('message:new', payload)
    
    logger.info('Message broadcast', {
      correlationId: envelope.correlationId,
      roomId,
      messageId: payload.messageId,
    })
  }
)
```

---

## Event Envelope

Todos os eventos são envolvidos in a `PubSubEnvelope`  para consistency:

```typescript
interface PubSubEnvelope<T = unknown> {
  channel: string               // Redis channel name
  type: string                  // Event type (same as channel)
  payload: T                    // Event-specific payload
  timestamp: string             // timestamp ISO 8601
  correlationId: string         // UUID  para distributed tracing
  publisherId?: string          // Service identifier (e.g., "web-1", "api-1")
}
```

**Exemplo**:
```json
{
  "channel": "chat.message.sent",
  "type": "chat.message.sent",
  "payload": {
    "messageId": "message:abc123",
    "roomId": "room:xyz789",
    "userId": "user:def456",
    "content": "Hello, world!",
    "createdAt": "2026-04-08T10:30:00.000Z",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2026-04-08T10:30:00.123Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "publisherId": "web-pod-1"
}
```

---

## Channel Naming Convention

Canais seguem o padrão: `{domain}.{entity}.{event}`

**Examples**:
- `chat.message.sent`
- `chat.message.updated`
- `room.member.joined`
- `user.presence.changed`

**Benefícios**:
- Hierarquia clara
- Fácil de entender what each channel does
- Suporta assinaturas com wildcard (e.g., `chat.*`  para all chat events)
- Habilita versionamento futuro (e.g., `v2.chat.message.sent`)

---

## Event Catalog

### Chat Domain

#### `chat.message.sent`

Publicado quando uma nova message é enviada em uma sala.

**Publicador**: apps/web Server Action (`sendMessage`)

**Payload**:
```typescript
interface MessageSentPayload {
  messageId: string             // ID da mensagem SurrealDB
  roomId: string                // Sala onde a mensagem foi enviada
  userId: string                // ID do usuário autor
  content: string               // Conteúdo da mensagem
  createdAt: string             // timestamp ISO 8601
  correlationId: string         // ID de rastreamento from Server Action
}
```

**Assinantes**:
- apps/api → Broadcast para clientes WebSocket via namespace `/chat`

**Exemplo**:
```typescript
await publisher.publish('chat.message.sent', {
  messageId: 'message:abc123',
  roomId: 'room:xyz789',
  userId: 'user:def456',
  content: 'Hello, world!',
  createdAt: '2026-04-08T10:30:00.000Z',
  correlationId: '550e8400-e29b-41d4-a716-446655440000',
})
```

---

#### `chat.message.updated`

Publicado qu eo a message is edited.

**Publicador**: apps/web Server Action (`updateMessage`)

**Payload**:
```typescript
interface MessageUpdatedPayload {
  messageId: string
  roomId: string
  userId: string                // Editor (must be original author or admin)
  content: string               // Novo content
  updatedAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to WebSocket clients

---

#### `chat.message.deleted`

Publicado qu eo a message is deleted.

**Publicador**: apps/web Server Action (`deleteMessage`)

**Payload**:
```typescript
interface MessageDeletedPayload {
  messageId: string
  roomId: string
  userId: string                // Deletador (must be original author or admin)
  deletedAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to WebSocket clients

---

### Room Domain

#### `room.created`

Publicado qu eo a new room is created.

**Publicador**: apps/web Server Action (`createRoom`)

**Payload**:
```typescript
interface RoomCreatedPayload {
  roomId: string
  name: string
  description: string | null
  createdBy: string             // Usuário ID
  createdAt: string
  correlationId: string
}
```

**Assinantes**:
- Future: analytics service, notification service

**Nota**: Not currently used  para WebSocket broadcast (salas are fetched on dem e).

---

#### `room.updated`

Publicado qu eo room metadata is updated.

**Publicador**: apps/web Server Action (`updateRoom`)

**Payload**:
```typescript
interface RoomUpdatedPayload {
  roomId: string
  name?: string
  description?: string
  updatedAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to WebSocket clients ( para live room name updates)

---

#### `room.deleted`

Publicado qu eo a room is deleted.

**Publicador**: apps/web Server Action (`deleteRoom`)

**Payload**:
```typescript
interface RoomDeletedPayload {
  roomId: string
  deletedBy: string             // Usuário ID
  deletedAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Kick all users from room, broadcast deletion

---

#### `room.member.joined`

Publicado qu eo a user joins a room.

**Publicador**: apps/web Server Action (`acceptInvite` or `addMember`)

**Payload**:
```typescript
interface MemberJoinedPayload {
  roomId: string
  userId: string
  joinedAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to room members (show "Usuário joined" notification)

---

#### `room.member.left`

Publicado qu eo a user leaves a room.

**Publicador**: apps/web Server Action (`leaveRoom`)

**Payload**:
```typescript
interface MemberLeftPayload {
  roomId: string
  userId: string
  leftAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to room members

---

#### `room.assistant.configured`

Publicado qu eo an AI assistant is configured  para a room.

**Publicador**: apps/web Server Action (`configureAssistant`)

**Payload**:
```typescript
interface AssistantConfiguredPayload {
  roomId: string
  assistantId: string
  config: {
    temperature: number
    maxTokens: number
    systemPrompt: string
  }
  configuredBy: string          // Usuário ID
  configuredAt: string
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to room members (show "Assistant configured" notification)

---

### Presence Domain

#### `user.presence.changed`

Publicado qu eo a user's online status changes.

**Publicador**: apps/api WebSocket h eler (on connect/disconnect)

**Payload**:
```typescript
interface PresenceChangedPayload {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastVern: string              // timestamp ISO 8601
  correlationId: string
}
```

**Assinantes**:
- apps/api → Broadcast to user's contacts/salas

**Nota**: This event originates from apps/api (not apps/web), so apps/api is both publisher  e subscriber.

---

### Typing Domain

#### `room.typing.started`

Publicado qu eo a user starts typing in a room.

**Publicador**: apps/api WebSocket h eler (from client event)

**Payload**:
```typescript
interface TypingStartedPayload {
  roomId: string
  userId: string
  startedAt: string
}
```

**Assinantes**:
- apps/api → Broadcast to other room members (not back to sender)

**Nota**: Ephemeral event, no correlation ID needed (not logged).

---

#### `room.typing.stopped`

Publicado qu eo a user stops typing in a room.

**Publicador**: apps/api WebSocket h eler (from client event or timeout)

**Payload**:
```typescript
interface TypingStoppedPayload {
  roomId: string
  userId: string
  stoppedAt: string
}
```

**Assinantes**:
- apps/api → Broadcast to other room members

---

## Subscriber Implementation

### Subscription Setup

All subscriptions are initialized in `apps/api/src/lib/redis-init.ts`:

```typescript
import { subscribeToAllEvents } from '../subscribers/event-subscriber'

export async function initializeRedis(): Promise<void> {
  // ... health check
  
  // Start event subscribers
  console.log('[Redis] Starting event subscribers...')
  unsubscribeAll = await subscribeToAllEvents()
  
  isInitialized = true
}
```

### Event Subscriber Module

`apps/api/src/subscribers/event-subscriber.ts`:

```typescript
import { getSubscriber } from '@multi-llm/plat param'
import type {
  MessageSentPayload,
  MemberJoinedPayload,
  PubSubEnvelope,
} from '@multi-llm/plat param'

export async function subscribeToAllEvents(): Promise<() => void> {
  const subscriber = getSubscriber()
  
  // Subscribe to all chat-related events
  const unsubscribes = await Promise.all([
    subscriber.subscribe<MessageSentPayload>(
      'chat.message.sent',
      h eleMessageSent
    ),
    subscriber.subscribe<MessageSentPayload>(
      'chat.message.updated',
      h eleMessageUpdated
    ),
    subscriber.subscribe<MessageSentPayload>(
      'chat.message.deleted',
      h eleMessageDeleted
    ),
    subscriber.subscribe<MemberJoinedPayload>(
      'room.member.joined',
      h eleMemberJoined
    ),
    subscriber.subscribe<MemberJoinedPayload>(
      'room.member.left',
      h eleMemberLeft
    ),
    // ... more subscriptions
  ])
  
  console.log('[API] Subscribed to all chat  e room events')
  
  // Return a function that unsubscribes from all channels
  return async () => {
     para (const unsubscribe of unsubscribes) {
      await unsubscribe()
    }
    console.log('[API] Unsubscribed from all events')
  }
}

function h eleMessageSent(envelope: PubSubEnvelope<MessageSentPayload>): void {
  const { roomId, ...payload } = envelope.payload
  
  logger.info('Broadcasting message', {
    correlationId: envelope.correlationId,
    messageId: payload.messageId,
    roomId,
  })
  
  // Transmitir para todos os clientes na sala
  io.of('/chat').to(`room:${roomId}`).emit('message:new', payload)
}

// ... more h elers
```

---

## Tratamento de Erros

### Publisher (apps/web)

Se Redis estiver indisponível, a Server Action deve ainda ter sucesso mas retornar um código especial:

```typescript
export async function sendMessage( paramData: FormData) {
  const correlationId = crypto.r eomUUID()
  
  try {
    // Save to database
    const message = await messageRepository.create({ ... })
    
    // Tentar to publish to Redis
    try {
      const publisher = getPublisher()
      await publisher.publish('chat.message.sent', { ...message, correlationId })
    } catch (redisError) {
      logger.error('Redis publish failed', {
        correlationId,
        error: redisError,
      })
      
      // Retornar sucesso com aviso
      return {
        success: true,
        data: message,
        code: 'REDIS_UNAVAILABLE',
        correlationId,
      }
    }
    
    return { success: true, data: message, correlationId }
  } catch (dbError) {
    logger.error('Database error', { correlationId, error: dbError })
    return {
      success: false,
      error: 'Failed to save message',
      code: 'INTERNAL_ERROR',
    }
  }
}
```

**Tratamento no Cliente**:
```typescript
const result = await sendMessage( paramData)

if (result.success && result.code === 'REDIS_UNAVAILABLE') {
  toast.warning('Message sent (may appear atrasoed  para others)')
} else if (!result.success) {
  toast.error(result.error)
} else {
  toast.success('Message sent')
}
```

### Subscriber (apps/api)

Se um h eler de assinante lançar um erro, deve ser capturado e registrado sem quebrar:

```typescript
subscriber.subscribe('chat.message.sent', async (envelope) => {
  try {
    const { roomId, ...payload } = envelope.payload
    io.of('/chat').to(`room:${roomId}`).emit('message:new', payload)
  } catch (error) {
    logger.error('Failed to broadcast message', {
      correlationId: envelope.correlationId,
      error,
    })
    // Não lance - deixe outros eventos continuarem processing
  }
})
```

---

## Correlation ID Flow

Correlation IDs habilitam rastreamento fim-a-fim através do sistema distribuído:

```
1. [apps/web: Server Action]
   correlationId = crypto.r eomUUID()
   logger.info('Server Action started', { correlationId })

2. [apps/web: Redis Publish]
   publisher.publish('chat.message.sent', { ...data, correlationId })
   logger.info('Event published', { correlationId })

3. [Redis Pub/Sub]
   Event transmitted with correlationId in envelope

4. [apps/api: Subscriber]
   subscriber.subscribe('chat.message.sent', (envelope) => {
     logger.info('Event received', { correlationId: envelope.correlationId })
     
5. [apps/api: WebSocket Broadcast]
     io.emit('message:new', { ...payload, correlationId: envelope.correlationId })
     logger.info('Broadcast complete', { correlationId: envelope.correlationId })
   })

6. [Client: WebSocket H eler]
   socket.on('message:new', (data) => {
     console.log('Received message', data.correlationId)
   })
```

**Log Aggregation**:

Todos os logs incluem `correlationId`, permitindo buscar por todas as entradas de log relacionadas a uma única operação:

```bash
# Buscar logs por a specific correlation ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/*.json

# Result:
# apps/web: Server Action started
# apps/web: Event published
# apps/api: Event received
# apps/api: Broadcast complete
```

---

## Per paramance Considerations

### Latency

- **Publisher → Redis**: <5ms (local Redis)
- **Redis → Subscriber**: <10ms
- **Total overhead**: ~15ms additional latency  para entrega em tempo real

### Throughput

Redis Pub/Sub pode gerenciar:
- **Messages/second**: 100k+ por nó
- **Carga atual**: ~100 messages/second (bem dentro da capacidade)
- **Scaling**: Adicionar mais instâncias Redis com sharding se necessário

### Message Size

- **Máximoimum payload size**: 512 MB (limite do Redis)
- **Payload típico**: ~1-5 KB (JSON message event)
- **Large messages**: Usar banco de dados + referência de ID ao invés de payload completo

---

## Monitoramento

### Health Check

apps/api inclui health check do Redis na inicialização:

```typescript
import { healthCheck } from '@multi-llm/plat param'

const health = await healthCheck()

if (!health.ok) {
  throw new Error('Redis health check failed')
}

if (health.latencyMs > 50) {
  console.warn(`Redis latency high: ${health.latencyMs}ms`)
}
```

### Metrics to Track

- **Publish latency**: Tempo para publicar evento to Redis
- **Subscribe latency**: Tempo desde recebimento do Redis to WebSocket broadcast
- **Event throughput**: Eventos/segundo por canal
- **Failed publishes**: Contagem de erros de publicação Redis
- **Subscriber errors**: Contagem de exceções de h eler

---

## Testes

### Unit Testing Publishers

```typescript
import { getPublisher } from '@multi-llm/plat param'
import { sendMessage } from './actions/messages'

jest.mock('@multi-llm/plat param')

describe('sendMessage', () => {
  it('should publish event to Redis', async () => {
    const mockPublish = jest.fn()
    ;(getPublisher as jest.Mock).mockReturnValue({
      publish: mockPublish,
    })
    
    const  paramData = new FormData()
     paramData.definido('roomId', 'room:123')
     paramData.definido('content', 'Hello')
    
    await sendMessage( paramData)
    
    expect(mockPublish).toHaveBeenCalledWith('chat.message.sent', {
      messageId: expect.any(String),
      roomId: 'room:123',
      content: 'Hello',
      correlationId: expect.any(String),
    })
  })
})
```

### Integration Testing Subscribers

```typescript
import { getPublisher, getSubscriber } from '@multi-llm/plat param'

describe('Event flow', () => {
  it('should broadcast WebSocket when event received', async () => {
    const publisher = getPublisher()
    const subscriber = getSubscriber()
    
    // Subscribe to event
    let receivedPayload: any
    await subscriber.subscribe('chat.message.sent', (envelope) => {
      receivedPayload = envelope.payload
    })
    
    // Publish event
    await publisher.publish('chat.message.sent', {
      messageId: 'msg:1',
      roomId: 'room:1',
      content: 'Test',
    })
    
    // Wait  para async delivery
    await new Promise(resolve => definidoTimeout(resolve, 100))
    
    expect(receivedPayload).toMatchObject({
      messageId: 'msg:1',
      content: 'Test',
    })
  })
})
```

---

## Migração from Current Architecture

### Antes (Direct Socket.io)

```typescript
// apps/web/server.ts
io.on('connection', (socket) => {
  socket.on('message', async (data) => {
    // Save to DB
    const message = await saveMessage(data)
    
    // Broadcast directly
    io.to(data.roomId).emit('message', message)
  })
})
```

**Problem**: Servidor WebSocket  paratemente acoplado to Next.js, não pode escalar independentemente.

### Depois (Redis Pub/Sub)

```typescript
// apps/web/src/lib/actions/messages.ts
export async function sendMessage( paramData: FormData) {
  const message = await saveMessage(data)
  await publisher.publish('chat.message.sent', message)
  return { success: true, data: message }
}

// apps/api/src/subscribers/event-subscriber.ts
subscriber.subscribe('chat.message.sent', (envelope) => {
  io.of('/chat').to(`room:${envelope.payload.roomId}`).emit('message:new', envelope.payload)
})
```

**Benefícios**:
- ✅ Serviços desacoplados (apps/web e apps/api)
- ✅ Server Actions substituem tratamento de mensagens WebSocket
- ✅ apps/api foca exclusivamente em entrega em tempo real
- ✅ Pode escalar servidor WebSocket independentemente

---

## Segurança

### Event Validation

Todos os payloads de eventos devem ser validados antes do processamento:

```typescript
import { z } from 'zod'

const MessageSentSchema = z.object({
  messageId: z.string(),
  roomId: z.string(),
  userId: z.string(),
  content: z.string().max(5000),
  createdAt: z.string(),
  correlationId: z.string().uuid(),
})

subscriber.subscribe('chat.message.sent', (envelope) => {
  const result = MessageSentSchema.safeParse(envelope.payload)
  
  if (!result.success) {
    logger.error('Invalid payload', {
      correlationId: envelope.correlationId,
      errors: result.error,
    })
    return
  }
  
  // Processar payload validado
  const payload = result.data
  io.of('/chat').to(`room:${payload.roomId}`).emit('message:new', payload)
})
```

### Authorization

Eventos publicados no Redis são **internos** e confiáveis. No entanto, broadcasts WebSocket ainda devem respeitar autorização de sala:

```typescript
subscriber.subscribe('chat.message.sent', async (envelope) => {
  const { roomId, ...payload } = envelope.payload
  
  // Obter todos os sockets na sala
  const sockets = await io.of('/chat').in(`room:${roomId}`).fetchSockets()
  
  // Fazer broadcast apenas para usuários autorizados
   para (const socket of sockets) {
    const hasAccess = await checkRoomAccess(socket.data.userId, roomId)
    if (hasAccess) {
      socket.emit('message:new', payload)
    } else {
      // Expulsar socket não autorizado
      socket.leave(`room:${roomId}`)
    }
  }
})
```

---

## Resumo

Este contrato Redis Pub/Sub fornece:
- ✅ Comunicação desacoplada entre apps/web e apps/api
- ✅ Payloads de eventos tipados com interfaces TypeScript
- ✅ Correlation IDs para rastreamento fim-a-fim
- ✅ Degradação graciosa quando Redis está indisponível
- ✅ Nomenclatura estruturada de eventos (`domain.entity.event`)
- ✅ Baixa latência (~15ms overhead)
- ✅ Tratamento de erros sem falhas em cascata
- ✅ Teste fácil com publishers/subscribers mock

**Próximo**: Ver [websocket-api.md](./websocket-api.md) para eventos WebSocket voltados ao cliente e [server-actions-api.md](./server-actions-api.md) para mutações de backend.
