# Modelo de Dados: Separação do WebSocket/API (EPIC-002)

**Data**: 2026-04-08
**Fase**: Fase 1 - Design & Contratos

## Visão Geral

Este documento define as estruturas de dados e transições de estado para a separação do WebSocket. Observe que **entidades persistentes** (User, Room, Message, Assistant, Invite) já estão definidas no EPIC-001 (schema do SurrealDB) e não são duplicadas aqui.

Este épico foca em **estado de runtime** e **payloads de comunicação** que fluem através do sistema:
- Estado de conexão WebSocket
- Payloads de eventos Redis Pub/Sub
- Tipos de request/response de Server Actions
- Dados de validação de sessão

## Entidades de Runtime

### 1. Conexão WebSocket

Representa uma conexão WebSocket ativa entre cliente e apps/api.

**Campos**:
```typescript
interface WebSocketConnection {
  socketId: string              // Socket.io connection ID
  userId: string                // Authenticated user ID (from JWT)
  sessionId: string             // NextAuth session ID (from JWT)
  namespace: '/chat' | '/presence' | '/typing'
  rooms: string[]               // Joined room IDs
  connectedAt: Date
  lastActivity: Date
  clientMetadata: {
    userAgent: string
    ip: string
  }
}
```

**Transições de Estado**:
```
[Desconectado] 
  → conectar com JWT → [Autenticando]
  → token válido → [Conectado]
  → entrar em sala → [Conectado + Na Sala]
  → desconectar/timeout/erro → [Desconectado]

[Conectado]
  → token expira → [Desconectado]
  → erro de rede → [Reconectando]
  → servidor desligando → [Desconectado]

[Reconectando]
  → reconexão bem-sucedida → [Conectado]
  → máximo de tentativas excedido → [Desconectado]
```

**Regras de Validação**:
- Token JWT deve ser válido e não expirado
- Usuário deve ter acesso à sala antes de entrar
- Conexão deve ter atividade dentro de 30 minutos (timeout configurável)

**Relacionamentos**:
- Um usuário pode ter múltiplas conexões (diferentes abas/dispositivos)
- Uma conexão pertence a um usuário
- Uma conexão pode estar em múltiplas salas (diferentes chats)

---

### 2. Envelope de Evento Redis

Wrapper para todos os eventos publicados/subscritos via Redis Pub/Sub.

**Campos**:
```typescript
interface PubSubEnvelope<T = unknown> {
  channel: string               // Redis channel name (e.g., "chat.message.sent")
  type: string                  // Event type (same as channel for now)
  payload: T                    // Type-specific payload
  timestamp: string             // ISO 8601 timestamp
  correlationId: string         // UUID for distributed tracing
  publisherId?: string          // Identifier of publishing service (e.g., "web-1")
}
```

**Transições de Estado**:
```
[Criado em Server Action]
  → publicar no Redis → [Em Trânsito]
  → recebido pelo subscriber → [Processando]
  → broadcast para WebSocket → [Entregue]
  OU → erro no subscriber → [Falhou]
```

**Regras de Validação**:
- `channel` deve seguir o padrão `{domínio}.{entidade}.{evento}`
- `correlationId` deve ser um UUID válido
- `timestamp` deve estar no formato ISO 8601
- `payload` deve corresponder ao schema do canal

---

### 3. Resultado de Server Action

Union discriminada para valores de retorno de Server Action.

**Tipo de Sucesso**:
```typescript
interface ActionSuccess<T = unknown> {
  success: true
  data: T
  correlationId: string
  timestamp: string
}
```

**Tipo de Erro**:
```typescript
interface ActionError {
  success: false
  error: string               // Mensagem de erro legível por humanos
  code: ErrorCode             // Código de erro legível por máquina
  details?: Record<string, string[]>  // Erros de validação específicos do campo
  correlationId?: string      // Pode estar ausente se erro antes da geração do ID
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

**Tipo Combinado**:
```typescript
type ActionResult<T = unknown> = ActionSuccess<T> | ActionError
```

**Padrão de Uso**:
```typescript
const result = await sendMessage(formData)

if (!result.success) {
  // Tratar erro
  console.error(result.error, result.code)
  return
}

// Usar dados
console.log(result.data.messageId)
```

---

## Tipos de Payload de Eventos

Todos os payloads que fluem através do Redis Pub/Sub e WebSocket.

### Domínio de Chat

#### chat.message.sent

Publicado quando uma nova mensagem é criada via Server Action.

```typescript
interface MessageSentPayload {
  messageId: string             // SurrealDB message ID
  roomId: string                // Room where message was sent
  userId: string                // Author user ID
  content: string               // Message content
  createdAt: string             // ISO 8601 timestamp
  correlationId: string         // Trace ID
}
```

**Subscribers**: apps/api WebSocket handler → broadcasts to room members

**Validação**:
- `messageId` deve existir no banco de dados
- `userId` deve ser membro de `roomId`
- `content` deve ter de 1 a 5000 caracteres

---

#### chat.message.updated

Publicado quando uma mensagem é editada.

```typescript
interface MessageUpdatedPayload {
  messageId: string
  roomId: string
  userId: string                // Editor (must be original author or admin)
  content: string               // New content
  updatedAt: string
  correlationId: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala

---

#### chat.message.deleted

Publicado quando uma mensagem é deletada.

```typescript
interface MessageDeletedPayload {
  messageId: string
  roomId: string
  userId: string                // Deleter (must be original author or admin)
  deletedAt: string
  correlationId: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala

---

### Domínio de Sala (Room)

#### room.member.joined

Publicado quando um usuário entra em uma sala.

```typescript
interface MemberJoinedPayload {
  roomId: string
  userId: string
  joinedAt: string
  correlationId: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala

---

#### room.member.left

Publicado quando um usuário sai de uma sala.

```typescript
interface MemberLeftPayload {
  roomId: string
  userId: string
  leftAt: string
  correlationId: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala

---

### Domínio de Presença (Presence)

#### user.presence.changed

Publicado quando o status online de um usuário muda.

```typescript
interface PresenceChangedPayload {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  correlationId: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para contatos/salas do usuário

---

### Domínio de Digitação (Typing)

#### room.typing.started

Publicado quando um usuário começa a digitar (client → WebSocket → Redis → outros clientes).

```typescript
interface TypingStartedPayload {
  roomId: string
  userId: string
  startedAt: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala
**Nota**: Não precisa de correlation ID (efêmero, não é registrado em log)

---

#### room.typing.stopped

Publicado quando um usuário para de digitar.

```typescript
interface TypingStoppedPayload {
  roomId: string
  userId: string
  stoppedAt: string
}
```

**Subscribers**: apps/api WebSocket handler → faz broadcast para membros da sala

---

## Dados de Validação de Sessão

Estruturas de dados para validação de token JWT em middleware WebSocket.

### Claims do Token JWT

Claims codificados nos tokens JWT do NextAuth.

```typescript
interface JWTClaims {
  sub: string                   // User ID
  sessionId: string             // Session ID (for invalidation)
  email?: string                // User email (optional)
  name?: string                 // User name (optional)
  iat: number                   // Issued at (Unix timestamp)
  exp: number                   // Expires at (Unix timestamp)
  jti?: string                  // JWT ID (optional)
}
```

**Regras de Validação**:
- `exp` deve estar no futuro
- `sub` (user ID) deve existir no banco de dados
- `sessionId` deve existir no Redis (se invalidação de sessão estiver implementada)

---

### Contexto de Autenticação WebSocket

Dados anexados ao socket do Socket.io após autenticação bem-sucedida.

```typescript
interface SocketAuthData {
  userId: string                // From JWT claims
  sessionId: string             // From JWT claims
  authenticatedAt: Date         // When middleware validated token
}
```

**Uso**:
```typescript
socket.data.userId  // Acessa o ID do usuário autenticado
socket.data.sessionId
```

---

## Resumo de Máquina de Estados

### Fluxo de Entrega de Mensagem

```
[Server Action] → Save to DB → [Persisted]
                → Publish to Redis → [Published]
                → apps/api subscriber receives → [Received]
                → WebSocket broadcast → [Delivered to Clients]
                → Client ACK → [Confirmed]

CAMINHOS DE FALHA:
[Server Action] → Erro no DB → [Falhou - revertido]
[Published] → Redis fora do ar → [Perdido - consistência eventual via polling]
[Received] → Sem clientes conectados → [Descartado - mensagem no DB para histórico]
```

### Ciclo de Vida da Conexão

```
[Client] → Connect with JWT → [Validating Token]
         → Token valid → [Connected]
         → Join room → [In Room]
         → Receive events → [Active]
         → Disconnect → [Cleanup]

CAMINHOS DE FALHA:
[Validating Token] → Inválido/expirado → [Rejeitado]
[Connected] → Token expira → [Desconexão Forçada]
[In Room] → Usuário removido da sala → [Expulso]
[Active] → Erro de rede → [Reconectando] → [Conectado]
```

---

## Resumo de Validação

| Entidade/Payload | Validações Principais |
|----------------|-----------------|
| WebSocketConnection | JWT válido, usuário existe, token não expirado |
| MessageSentPayload | conteúdo 1-5000 caracteres, usuário é membro da sala |
| MessageUpdatedPayload | userId corresponde ao autor original ou é admin |
| MessageDeletedPayload | userId corresponde ao autor original ou é admin |
| MemberJoinedPayload | usuário tem permissão para entrar na sala |
| TypingPayload | usuário é membro da sala |
| JWTClaims | exp > agora, sub existe no DB |

---

## Tratamento de Erros

Todas as Server Actions retornam `ActionResult<T>` com erros tipados:

```typescript
// Exemplos de respostas de erro
{
  success: false,
  error: "Você não tem permissão para enviar mensagens nesta sala",
  code: "UNAUTHORIZED"
}

{
  success: false,
  error: "Validação falhou",
  code: "VALIDATION_ERROR",
  details: {
    content: ["Mensagem muito longa (máximo 5000 caracteres)"]
  }
}

{
  success: false,
  error: "Redis indisponível. Mensagem salva mas não transmitida em tempo real.",
  code: "REDIS_UNAVAILABLE",
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

Clientes verificam `result.success` antes de acessar `result.data`.

---

## Resumo

Este modelo de dados define:
- ✅ Estado de conexão WebSocket em tempo de execução
- ✅ Estrutura de envelope de eventos Redis
- ✅ Tipos de resultado de Server Action (discriminação sucesso/erro)
- ✅ Schemas de payload de eventos para todos os domínios (chat, room, presence, typing)
- ✅ Claims de token JWT e dados de validação
- ✅ Transições de estado para conexões e entrega de mensagens
- ✅ Regras de validação para todas as entidades

**Próximo**: Definir contratos de API (eventos WebSocket, Server Actions, canais Redis) em `/contracts/`.
