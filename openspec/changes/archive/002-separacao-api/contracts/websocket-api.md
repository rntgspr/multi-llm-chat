# Contrato da API WebSocket

**Version**: 1.0.0  
**Date**: 2026-04-08  
**Service**: apps/api (port 4000)

## Visão Geral

Este documento define o contrato da API WebSocket para comunicação em tempo real entre clientes e o backend do Synergy Chat. O servidor WebSocket roda em `apps/api` us eo Socket.io 4.8.3.

## Conexão

### URL Base

- **Desenvolvimento**: `http://localhost:4000`
- **Produção**: `${NEXT_PUBLIC_WS_URL}` (das variáveis de ambiente)

### Transporte

- **Preferencial**: WebSocket (`websocket`)
- **Fallback**: Long polling (`polling`)

### Autenticação

Todas as conexões WebSocket requerem um token JWT válido do NextAuth.

**Transmissão de Token**:

Opção 1 (Recomendada):
```typescript
const socket = io('http://localhost:4000/chat', {
  auth: {
    token: session?.accessToken  // NextAuth JWT token
  }
})
```

Opção 2 (Fallback):
```typescript
const socket = io('http://localhost:4000/chat?token=<JWT_TOKEN>')
```

**Authentication Flow**:

1. Cliente inicia conexão com token JWT
2. Servidor valida token no middleware (verifica assinatura com `NEXTAUTH_SECRET`)
3. Se válido → conexão estabelecida, `socket.data.userId` definido
4. Se inválido → conexão rejeitada com erro

**Códigos de Erro**:
- `Authentication token required` - Nenhum token  paranecido
- `Invalid token` - Verificação de assinatura do token falhou ou expirou

---

## Namespaces

O servidor WebSocket usa namespaces para separar responsabilidades.

### `/chat` - Chat Messages

**Propósito**: Entrega e sincronização de mensagens de chat em tempo real

**Conexão**:
```typescript
const chatSocket = io('http://localhost:4000/chat', {
  auth: { token }
})
```

**Autorização**: Deve estar autenticado (token JWT válido)

---

### `/presence` - Usuário Presence

**Propósito**: Atualizações de status online/offline/ausente

**Conexão**:
```typescript
const presenceSocket = io('http://localhost:4000/presence', {
  auth: { token }
})
```

**Autorização**: Deve estar autenticado

---

### `/typing` - Typing Indicators

**Propósito**: Status de digitação em tempo real para salas de chat

**Conexão**:
```typescript
const typingSocket = io('http://localhost:4000/typing', {
  auth: { token }
})
```

**Autorização**: Deve estar autenticado

---

## Eventos

### `/chat` Namespace Events

#### Server → Client Events

##### `message:new`

Emitido qu eo a new message is sent to a room the user is in.

**Payload**:
```typescript
{
  messageId: string             // ID da mensagem SurrealDB
  roomId: string                // ID da sala
  userId: string                // ID do autor
  content: string               // Conteúdo da mensagem
  createdAt: string             // timestamp ISO 8601
  correlationId: string         // ID de rastreamento
}
```

**Exemplo**:
```typescript
chatSocket.on('message:new', (data) => {
  console.log(`Nova mensagem na sala ${data.roomId}:`, data.content)
  // Atualizar UI
})
```

---

##### `message:updated`

Emitido qu eo a message is edited.

**Payload**:
```typescript
{
  messageId: string
  roomId: string
  userId: string                // Editor
  content: string               // Conteúdo atualizado
  updatedAt: string
  correlationId: string
}
```

---

##### `message:deleted`

Emitido qu eo a message is deleted.

**Payload**:
```typescript
{
  messageId: string
  roomId: string
  userId: string                // Deletador
  deletedAt: string
  correlationId: string
}
```

---

##### `member:joined`

Emitido qu eo a user joins a room.

**Payload**:
```typescript
{
  roomId: string
  userId: string
  joinedAt: string
  correlationId: string
}
```

---

##### `member:left`

Emitido qu eo a user leaves a room.

**Payload**:
```typescript
{
  roomId: string
  userId: string
  leftAt: string
  correlationId: string
}
```

---

#### Client → Server Events

##### `room:join`

Requisição para join a room  e start receiving messages.

**Payload**:
```typescript
{
  roomId: string
}
```

**Resposta**: Sem resposta direta. Se bem-sucedido, cliente começa a receber `message:new` eventos para aquela sala.

**Erros**:
- Usuário não autorizado a entrar na sala → socket desconectado

**Exemplo**:
```typescript
chatSocket.emit('room:join', { roomId: 'room:abc123' })
```

---

##### `room:leave`

Requisição para leave a room  e stop receiving messages.

**Payload**:
```typescript
{
  roomId: string
}
```

**Exemplo**:
```typescript
chatSocket.emit('room:leave', { roomId: 'room:abc123' })
```

---

### `/presence` Namespace Events

#### Server → Client Events

##### `presence:changed`

Emitido qu eo a user's presence status changes.

**Payload**:
```typescript
{
  userId: string
  status: 'online' | 'away' | 'offline'
  lastVern: string              // timestamp ISO 8601
  correlationId: string
}
```

**Exemplo**:
```typescript
presenceSocket.on('presence:changed', (data) => {
  console.log(`Usuário ${data.userId} está agora ${data.status}`)
  // Atualizar indicador de presença na UI
})
```

---

#### Client → Server Events

##### `presence:update`

Atualiza o usuário atual's presence status.

**Payload**:
```typescript
{
  status: 'online' | 'away'     // Cannot definido 'offline' (automático na desconexão)
}
```

**Exemplo**:
```typescript
presenceSocket.emit('presence:update', { status: 'away' })
```

---

### `/typing` Namespace Events

#### Server → Client Events

##### `typing:started`

Emitido qu eo a user starts typing in a room.

**Payload**:
```typescript
{
  roomId: string
  userId: string
  startedAt: string
}
```

**Exemplo**:
```typescript
typingSocket.on('typing:started', (data) => {
  console.log(`Usuário ${data.userId} está digit eo em ${data.roomId}`)
  // Mostrar "Usuário está digit eo..." indicador
})
```

---

##### `typing:stopped`

Emitido qu eo a user stops typing in a room.

**Payload**:
```typescript
{
  roomId: string
  userId: string
  stoppedAt: string
}
```

---

#### Client → Server Events

##### `typing:start`

Notifica que the current user started typing in a room.

**Payload**:
```typescript
{
  roomId: string
}
```

**Exemplo**:
```typescript
typingSocket.emit('typing:start', { roomId: 'room:abc123' })
```

**Nota**: Cliente deve fazer debounce deste evento (e.g., emitir apenas uma vez por 3 segundos enquanto digita).

---

##### `typing:stop`

Notifica que the current user stopped typing in a room.

**Payload**:
```typescript
{
  roomId: string
}
```

**Exemplo**:
```typescript
typingSocket.emit('typing:stop', { roomId: 'room:abc123' })
```

**Nota**: Enviado automaticamente em disconnect or after 5 segundos de inatividade.

---

## Connection Lifecycle

### Eventos de Conexão

Todos os namespaces emitem st eard Socket.io connection events:

#### `connect`

Emitido qu eo connection is successfully established.

**Exemplo**:
```typescript
chatSocket.on('connect', () => {
  console.log('Conectado ao /chat namespace')
  // Reentrar em salas se esta  para uma reconexão
})
```

---

#### `disconnect`

Emitido qu eo connection is lost.

**Payload**: `(reason: string)`

**Reasons**:
- `io server disconnect` - Servidor desconectou  paraçadamente (e.g., token expirado)
- `io client disconnect` - Cliente chamou `socket.disconnect()`
- `ping timeout` - Conexão expirou (sem atividade)
- `transport close` - Erro de rede

**Exemplo**:
```typescript
chatSocket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason)
  
  if (reason === 'io server disconnect') {
    // Server kicked us out, likely token expirado
    refreshTokenAndReconnect()
  }
})
```

---

#### `connect_error`

Emitido qu eo connection fails.

**Payload**: `(error: Error)`

**Exemplo**:
```typescript
chatSocket.on('connect_error', (error) => {
  console.error('Conexão falhou:', error.message)
  
  if (error.message === 'Invalid token') {
    // Atualizar token e tentar novamente
  }
})
```

---

### Reconexão

Socket.io gerencia reconexão automaticamente with exponential backoff.

**Configuração**:
```typescript
const socket = io('http://localhost:4000/chat', {
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,        // Começar com 1s atraso
  reconnectionDelayMáximo: 5000,     // Máximo 5s atraso
  reconnectionAttempts: 5,        // Tentar 5 vezes antes de desistir
})
```

**Na Reconexão**:
1. `connect` evento é emitido
2. Cliente deve reentrar nas salas (não persistido entre reconexões)
3. Cliente pode buscar mensagens perdidas do DB se necessário

---

## Tratamento de Erros

### Erros de Autenticação

**Erro**: Nenhum token fornecido
**Mensagem**: `"Authentication token required"`
**Ação**: Rejeitar conexão

**Erro**: Token inválido ou expirado
**Mensagem**: `"Invalid token"`
**Ação**: Rejeitar conexão

**Tratamento no Cliente**:
```typescript
socket.on('connect_error', (err) => {
  if (err.message.includes('token')) {
    // Atualizar autenticação e tentar novamente
    const newToken = await refreshSession()
    socket.auth.token = newToken
    socket.connect()
  }
})
```

---

### Authorization Errors

**Erro**: Usuário não autorizado a entrar na sala
**Ação**: Disconnect socket with error

**Implementação no Servidor**:
```typescript
socket.on('room:join', async ({ roomId }) => {
  const hasAccess = await checkRoomAccess(socket.data.userId, roomId)
  
  if (!hasAccess) {
    socket.disconnect(true) // Desconexão  paraçada
    return
  }
  
  socket.join(`room:${roomId}`)
})
```

---

### Network Errors

**Sintoma**: `disconnect` event with `transport close` reason

**Tratamento no Cliente**: Socket.io automatically reconnects with exponential backoff

**Degradação Graciosa**:
- Mostrar "offline" indicador in UI
- Queue optimistic updates locally
- Sync when connection restored

---

## Room Broadcasting

### Server-side Implementation

Mensagens são transmitidas para all sockets in a room:

```typescript
// apps/api/src/subscribers/event-subscriber.ts
subscriber.subscribe('chat.message.sent', async (envelope) => {
  const { roomId, ...payload } = envelope.payload
  
  // Transmitir para todos os clientes na sala
  io.of('/chat').to(`room:${roomId}`).emit('message:new', payload)
})
```

### Room Naming Convention

Todos os identificadores de sala são prefixed with `room:`:

```typescript
socket.join('room:abc123')   // ✅ Correto
socket.join('abc123')        // ❌ Errado
```

Isso previne colisões with other Socket.io features.

---

## Per paramance Considerations

### Throttling

**Typing events**: Fazer debounce no cliente to max 1 evento por 3 seconds
**Presence updates**: Limitar taxa para 1 por minuto por usuário
**Room joins/leaves**: Sem limite de taxa (operações infrequentes)

### Tamanho do Payload

**Máximoimum message content**: 5000 caracteres (validado em Server Actions)
**Máximoimum salas per connection**: Sem limite rígido, but limite prático ~100 salas

### Metas de Latência

- **Message delivery**: <1 second (p99)
- **Typing indicador**: <500ms (p99)
- **Presence update**: <2 seconds (p99)
- **Authentication h eshake**: <50ms latência adicional para validação JWT

---

## Example Client Implementation

### Hook React

```typescript
// apps/web/src/hooks/use-websocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useWebSocket(namespace: string, token: string) {
  const [socket, definidoSocket] = useState<Socket | null>(null)
  const [connected, definidoConnected] = useState(false)
  
  useEffect(() => {
    const ws = io(`${process.env.NEXT_PUBLIC_WS_URL}${namespace}`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMáximo: 5000,
      reconnectionAttempts: 5,
    })
    
    ws.on('connect', () => {
      console.log('WebSocket connected')
      definidoConnected(true)
    })
    
    ws.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      definidoConnected(false)
    })
    
    ws.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
    })
    
    definidoSocket(ws)
    
    return () => {
      ws.close()
    }
  }, [namespace, token])
  
  return { socket, connected }
}
```

### Usage

```typescript
'use client'

function ChatRoom({ roomId }) {
  const session = useSession()
  const { socket, connected } = useWebSocket('/chat', session?.accessToken)
  
  useEffect(() => {
    if (!socket || !connected) return
    
    // Join room
    socket.emit('room:join', { roomId })
    
    // Listen  para new messages
    socket.on('message:new', (data) => {
      console.log('Novo message:', data)
      // Atualizar UI
    })
    
    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('message:new')
    }
  }, [socket, connected, roomId])
  
  return (
    <div>
      <div>Status: {connected ? '🟢 Online' : '🔴 Offline'}</div>
      {/* Chat UI */}
    </div>
  )
}
```

---

## Segurança

### Validação de Token

- Tokens are validated on every connection attempt
- Expired tokens are rejected immediately
- Token expiry is checked: `exp` claim must be in the future

### Room Authorization

- Usuários can only join salas they have access to
- Room access is verified in `room:join` h eler
- Unauthorized join attempts result in disconnection

### Sanitização de Dados

- All incoming event data is validated antes do processamento
- Usuário-provided content is sanitized be parae broadcasting
- ID da salas are validated against database be parae joining

---

## Migração Notes

### Da Arquitetura Atual

**Antes** (apps/web servidor customizado):
```typescript
// apps/web/server.ts
io.on('connection', (socket) => {
  // Lógica WebSocket misturada com Next.js
})
```

**Depois** (apps/api st ealone):
```typescript
// apps/api/src/websocket/namespaces/chat.ts
export function configureChatNamespace(io: Server) {
  const chatNs = io.of('/chat')
  chatNs.use(sessionMiddleware)
  chatNs.on('connection', (socket) => {
    // Separação limpa
  })
}
```

### Migração do Cliente

**Atualizar URL do WebSocket**:
```typescript
// Antigo
const socket = io('http://localhost:3000')

// Novo
const socket = io('http://localhost:4000/chat', {
  auth: { token: session.accessToken }
})
```

---

## Health Check

### Endpoint

`GET /health`

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T10:30:00.000Z",
  "websocket": {
    "active_connections": 42,
    "namespaces": ["/chat", "/presence", "/typing"]
  }
}
```

**Códigos de Status**:
- `200 OK` - Servidor saudável
- `503 Service Unavailable` - Servidor degradado (e.g., Redis  paraa do ar)

---

## Versioning

**Versão Atual**: 1.0.0

**Política de Mudanças Incompatíveis**:
- Aumento de versão major para mudanças incompatíveis (e.g., eventos renomeados, payloads alterados)
- Aumento de versão minor para novos eventos (compatível com versões anteriores)
- Aumento de versão patch para correções de bugs

**Descontinuação**:
- Eventos serão marcados como descontinuados 1 versão antes da remoção
- Clientes recebem avisos no console ao usar eventos descontinuados

---

## Resumo

Esta API WebSocket fornece:
- ✅ Conexões autenticadas via tokens JWT
- ✅ Três namespaces: `/chat`, `/presence`, `/typing`
- ✅ Entrega de mensagens em tempo real com correlation IDs
- ✅ Reconexão automática com backoff exponencial
- ✅ Broadcasting baseado em salas para entrega eficiente de mensagens
- ✅ Tratamento e degradação graciosa de erros
- ✅ Metas de performance (<1s latência de mensagem p99)

**Próximo**: Ver [server-actions-api.md](./server-actions-api.md) para API de mutação de backend e [redis-events.md](./redis-events.md) para schemas de eventos internos.
