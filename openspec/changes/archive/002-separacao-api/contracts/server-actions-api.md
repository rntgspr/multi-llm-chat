# Contrato da API Server Actions

**Version**: 1.0.0  
**Date**: 2026-04-08  
**Service**: apps/web (Next.js Server Actions)

## Visão Geral

Este documento define the Server Actions API contract para mutações de backend in the Synergy Chat application. Server Actions replace traditional REST API routes  e run directly on the Next.js server.

All Server Actions are located in `apps/web/src/lib/actions/`  e use the `'use server'` directive.

## Autenticação

Todas as Server Actions requerem authentication via NextAuth. A sessão é recuperada using the `auth()` helper:

```typescript
import { auth } from '@/auth'

export async function someAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    }
  }
  
  // Proceed with action
}
```

**Requisições Não Autenticadas**: Retorna erro com código `UNAUTHORIZED`

---

## Response Format

Todas as Server Actions retornam a discriminated union type `ActionResult<T>`:

### Success Response

```typescript
interface ActionSuccess<T> {
  success: true
  data: T
  correlationId: string         // UUID  para tracing
  timestamp: string             // timestamp ISO 8601
}
```

### Error Response

```typescript
interface ActionError {
  success: false
  error: string                 // Human-readable error message
  code: ErrorCode               // Machine-readable error code
  details?: Record<string, string[]>  // Field-level validation errors
  correlationId?: string        // May be absent if error be parae ID generation
}

enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  REDIS_UNAVAILABLE = 'REDIS_UNAVAILABLE',
}
```

### Usage Pattern

```typescript
const result = await sendMessage( paramData)

if (!result.success) {
  // H ele error
  console.error(result.error)
  toast.error(result.error)
  return
}

// Use data
console.log('Message sent:', result.data.messageId)
```

---

## Input Validation

Todas as Server Actions validam inputs using Zod schemas:

```typescript
import { z } from 'zod'

const SendMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(5000),
})

export async function sendMessage( paramData: FormData) {
  const validatedFields = SendMessageSchema.safeParse({
    roomId:  paramData.get('roomId'),
    content:  paramData.get('content'),
  })
  
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { roomId, content } = validatedFields.data
  // ...
}
```

---

## Actions Reference

### Room Actions

Module: `apps/web/src/lib/actions/salas.ts`

---

#### `createRoom( paramData: FormData): Promise<ActionResult<Room>>`

Criar um novo chat room.

**Entrada**:
```typescript
{
  name: string            // 1-100 caracteres
  description?: string    // Optional, max 500 caracteres
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,                    // ID da sala (e.g., "room:abc123")
    name: string,
    description: string | null,
    createdBy: string,             // Usuário ID
    createdAt: string,
    members: string[],             // Initially just the creator
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated
- `VALIDATION_ERROR` - Invalid input (e.g., name too long)
- `INTERNAL_ERROR` - Database error

**Efeitos Colaterais**:
- Creates room in database
- Publishes `room.created` event to Redis ( para future analytics)

**Exemplo**:
```typescript
const  paramData = new FormData()
 paramData.definido('name', 'Engineering Team')
 paramData.definido('description', 'Discuss engineering topics')

const result = await createRoom( paramData)
```

---

#### `listRooms(): Promise<ActionResult<Room[]>>`

Listar todos salas the current user is a member of.

**Entrada**: None (uses authenticated user from session)

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string | null,
      createdBy: string,
      createdAt: string,
      members: string[],
      lastMessageAt: string | null,
      unreadCount: number,
    },
    // ...
  ],
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated

**Exemplo**:
```typescript
const result = await listRooms()

if (result.success) {
  result.data. paraEach(room => {
    console.log(`${room.name} (${room.unreadCount} unread)`)
  })
}
```

---

#### `updateRoom( paramData: FormData): Promise<ActionResult<Room>>`

Atualizar metadados da sala (name, description).

**Entrada**:
```typescript
{
  roomId: string
  name?: string           // 1-100 caracteres
  description?: string    // Máximo 500 caracteres
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    description: string | null,
    updatedAt: string,
    // ... other room fields
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room admin
- `NOT_FOUND` - Room doesn't exist
- `VALIDATION_ERROR` - Invalid input

**Efeitos Colaterais**:
- Updates room in database
- Publishes `room.updated` event to Redis

---

#### `deleteRoom( paramData: FormData): Promise<ActionResult<void>>`

Deletar uma sala (soft delete).

**Entrada**:
```typescript
{
  roomId: string
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: undefined,
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room creator
- `NOT_FOUND` - Room doesn't exist

**Efeitos Colaterais**:
- Marks room as deleted in database
- Publishes `room.deleted` event to Redis
- Kicks all users from room (WebSocket)

---

### Message Actions

Module: `apps/web/src/lib/actions/messages.ts`

---

#### `sendMessage( paramData: FormData): Promise<ActionResult<Message>>`

Enviar uma mensagem para uma sala.

**Entrada**:
```typescript
{
  roomId: string
  content: string         // 1-5000 caracteres
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,                    // Message ID
    roomId: string,
    userId: string,
    content: string,
    createdAt: string,
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room member
- `NOT_FOUND` - Room doesn't exist
- `VALIDATION_ERROR` - Content too long or empty
- `REDIS_UNAVAILABLE` - Message saved but not broadcast (eventual consistency)

**Efeitos Colaterais**:
- Saves message to database
- Publishes `chat.message.sent` event to Redis (includes `correlationId`)
- apps/api broadcasts to WebSocket clients in the room

**Degradação Graciosa**:
If Redis Pub/Sub is unavailable:
- Message is still saved to database
- Returns success with code `REDIS_UNAVAILABLE`
- Client shows optimistic update, message appears locally
- Other users will see message on refresh/polling

**Exemplo**:
```typescript
const  paramData = new FormData()
 paramData.definido('roomId', 'room:abc123')
 paramData.definido('content', 'Hello, world!')

const result = await sendMessage( paramData)

if (!result.success) {
  if (result.code === 'REDIS_UNAVAILABLE') {
    // Message saved but not broadcast
    toast.warning('Message sent (may appear atrasoed  para others)')
  } else {
    toast.error(result.error)
  }
} else {
  // Success, correlationId can be used  para tracing
  console.log('Sent with trace ID:', result.correlationId)
}
```

---

#### `listMessages( paramData: FormData): Promise<ActionResult<Message[]>>`

Listar mensagens em uma sala (paginated).

**Entrada**:
```typescript
{
  roomId: string
  limit?: number          // Default 50, max 100
  be parae?: string         // Message ID  para pagination (fetch older messages)
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: [
    {
      id: string,
      roomId: string,
      userId: string,
      content: string,
      createdAt: string,
      updatedAt: string | null,
    },
    // ...
  ],
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room member
- `NOT_FOUND` - Room doesn't exist
- `VALIDATION_ERROR` - Invalid pagination parameters

**Exemplo**:
```typescript
const  paramData = new FormData()
 paramData.definido('roomId', 'room:abc123')
 paramData.definido('limit', '50')

const result = await listMessages( paramData)
```

---

#### `updateMessage( paramData: FormData): Promise<ActionResult<Message>>`

Editar uma mensagem (only by original author within 24 hours).

**Entrada**:
```typescript
{
  messageId: string
  content: string         // 1-5000 caracteres
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,
    roomId: string,
    userId: string,
    content: string,
    updatedAt: string,
    // ...
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not original author
- `NOT_FOUND` - Message doesn't exist
- `CONFLICT` - Message older than 24 hours (cannot edit)
- `VALIDATION_ERROR` - Invalid content

**Efeitos Colaterais**:
- Updates message in database
- Publishes `chat.message.updated` event to Redis

---

#### `deleteMessage( paramData: FormData): Promise<ActionResult<void>>`

Deletar uma mensagem (only by original author or room admin).

**Entrada**:
```typescript
{
  messageId: string
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: undefined,
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not authorized
- `NOT_FOUND` - Message doesn't exist

**Efeitos Colaterais**:
- Marks message as deleted in database
- Publishes `chat.message.deleted` event to Redis

---

### Assistant Actions

Module: `apps/web/src/lib/actions/assistants.ts`

---

#### `listAssistants(): Promise<ActionResult<Assistant[]>>`

Listar disponíveis AI assistants.

**Entrada**: None

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string,
      model: string,
      capabilities: string[],
      isActive: boolean,
    },
    // ...
  ],
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**: None (public endpoint)

---

#### `configureAssistant( paramData: FormData): Promise<ActionResult<RoomAssistant>>`

Configurar um assistente  para a room.

**Entrada**:
```typescript
{
  roomId: string
  assistantId: string
  config: {
    temperature?: number      // 0-1
    maxTokens?: number
    systemPrompt?: string
  }
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    roomId: string,
    assistantId: string,
    config: AssistantConfig,
    activatedAt: string,
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room admin
- `NOT_FOUND` - Room or assistant doesn't exist
- `VALIDATION_ERROR` - Invalid config

**Efeitos Colaterais**:
- Saves assistant configuration to database
- Publishes `room.assistant.configured` event to Redis

---

### Invite Actions

Module: `apps/web/src/lib/actions/invites.ts`

---

#### `createInvite( paramData: FormData): Promise<ActionResult<Invite>>`

Criar um link de convite  para a room.

**Entrada**:
```typescript
{
  roomId: string
  expiresIn?: number      // Seconds, default 7 days
  maxUses?: number        // Default unlimited
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,
    code: string,           // Invite code (e.g., "abc123xyz")
    roomId: string,
    createdBy: string,
    expiresAt: string,
    maxUses: number | null,
    currentUses: number,
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated or not room admin
- `NOT_FOUND` - Room doesn't exist

**Exemplo**:
```typescript
const  paramData = new FormData()
 paramData.definido('roomId', 'room:abc123')
 paramData.definido('expiresIn', String(7 * 24 * 3600)) // 7 days

const result = await createInvite( paramData)

if (result.success) {
  const inviteUrl = `${window.location.origin}/invite/${result.data.code}`
  console.log('Invite link:', inviteUrl)
}
```

---

#### `acceptInvite( paramData: FormData): Promise<ActionResult<Room>>`

Aceitar um convite  e join a room.

**Entrada**:
```typescript
{
  code: string            // Invite code
}
```

**Resposta de Sucesso**:
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    description: string | null,
    // ... room data
  },
  correlationId: string,
  timestamp: string
}
```

**Códigos de Erro**:
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Invite doesn't exist or expired
- `CONFLICT` - Already a member of the room

**Efeitos Colaterais**:
- Adds user to room members
- Increments invite use count
- Publishes `room.member.joined` event to Redis

---

## Tratamento de Erros

### Client-Side Pattern

```typescript
'use client'

import { useFormState } from 'react-dom'
import { sendMessage } from '@/lib/actions/messages'

export function MessageForm({ roomId }) {
  const [state,  paramAction] = useFormState(sendMessage, null)
  
  return (
    < param action={ paramAction}>
      <input type="hidden" name="roomId" value={roomId} />
      <textarea name="content" />
      
      {state && !state.success && (
        <div className="error">
          {state.error}
          {state.details && (
            <ul>
              {Object.entries(state.details).map(([field, errors]) => (
                <li key={field}>{field}: {errors.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <button type="submit">Send</button>
    </ param>
  )
}
```

---

## Optimistic Updates

Server Actions se integram with React's `useOptimistic` hook  para instant UI feedback:

```typescript
'use client'

import { useOptimistic } from 'react'
import { sendMessage } from '@/lib/actions/messages'

export function ChatMessages({ initialMessages, roomId }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state, newMessage) => [...state, newMessage]
  )
  
  async function h eleSend( paramData: FormData) {
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content:  paramData.get('content'),
      userId: session.user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    
    // Immediately show in UI
    addOptimisticMessage(tempMessage)
    
    // Send to server
    const result = await sendMessage( paramData)
    
    if (!result.success) {
      toast.error(result.error)
      // Optimistic message will be removed on revalidation
    }
  }
  
  return (
    <>
      {optimisticMessages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
    </>
  )
}
```

---

## Rate Limiting

Server Actions implementam rate limiting to prevent abuse:

- **sendMessage**: 10 messages por minuto por usuário
- **createRoom**: 5 salas per hour per user
- **createInvite**: 10 invites per hour per user

**Resposta de Rate Limit**:
```typescript
{
  success: false,
  error: 'Rate limit exceeded. Please try again later.',
  code: 'RATE_LIMIT_EXCEEDED',
  retryDepois: 60  // Seconds until retry allowed
}
```

---

## Correlation IDs

Todas as Server Actions bem-sucedidas include a `correlationId` in the response. Este UUID permite rastrear the operation através do sistema distribuído:

```typescript
const result = await sendMessage( paramData)

if (result.success) {
  console.log('Correlation ID:', result.correlationId)
  
  // This ID appears in:
  // 1. Server Action logs
  // 2. Redis Pub/Sub event
  // 3. WebSocket broadcast payload
  // 4. apps/api logs
}
```

**Casos de Uso**:
- Depuração de falhas de entrega de mensagem
- Análise de per paramance (track end-to-end latency)
- Tickets de suporte (incluir correlation ID  para investigation)

---

## Testes

### Unit Testing Server Actions

```typescript
import { sendMessage } from '@/lib/actions/messages'
import { auth } from '@/auth'

jest.mock('@/auth')

describe('sendMessage', () => {
  it('should require authentication', async () => {
    (auth as jest.Mock).mockResolvedValue(null)
    
    const  paramData = new FormData()
     paramData.definido('roomId', 'room:123')
     paramData.definido('content', 'Hello')
    
    const result = await sendMessage( paramData)
    
    expect(result.success).toBe(false)
    expect(result.code).toBe('UNAUTHORIZED')
  })
  
  it('should validate message content', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user:1' } })
    
    const  paramData = new FormData()
     paramData.definido('roomId', 'room:123')
     paramData.definido('content', '') // Empty content
    
    const result = await sendMessage( paramData)
    
    expect(result.success).toBe(false)
    expect(result.code).toBe('VALIDATION_ERROR')
  })
})
```

---

## Migração from API Routes

### Antes (API Route)

```typescript
// app/api/messages/route.ts
export async function POST(req: Request) {
  const session = await getServerSession()
  const body = await req.json()
  
  // ... validation  e logic
  
  return NextResponse.json({ message })
}

// Client
const res = await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomId, content }),
})
const data = await res.json()
```

### Depois (Server Action)

```typescript
// lib/actions/messages.ts
'use server'

export async function sendMessage( paramData: FormData) {
  const session = await auth()
  // ... validation  e logic
  return { success: true, data: message, correlationId, timestamp }
}

// Client
const result = await sendMessage( paramData)
```

**Benefícios**:
- No manual fetch calls
- Automatic type safety (no need  para separate API client types)
- Works with  params (progressive enhancement)
- Simpler error h eling (no HTTP status codes)

---

## Resumo

Server Actions provide:
- ✅ Type-safe backend mutations without REST API
- ✅ Consistent error h eling with discriminated unions
- ✅ Automatic authentication via NextAuth
- ✅ Redis Pub/Sub integration  para WebSocket broadcasts
- ✅ Correlation IDs  para distributed tracing
- ✅ Graceful degradation qu eo Redis está indisponível
- ✅ Optimistic updates  para instant UI feedback
- ✅ Input validation with Zod schemas
- ✅ Rate limiting to prevent abuse

**Próximo**: Ver [redis-events.md](./redis-events.md) para schemas de eventos internos  e [websocket-api.md](./websocket-api.md)  para real-time communication.
