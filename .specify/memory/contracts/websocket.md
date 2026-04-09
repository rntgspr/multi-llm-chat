# WebSocket Events Contract

**Versão:** 1.0  
**Última atualização:** 2026-04-03

---

## Conexão

### Endpoint
```
ws://localhost:3000/api/socket
```

### Autenticação
```typescript
// Client envia ao conectar
{
  "type": "auth",
  "token": "jwt_token_here"
}

// Server responde
{
  "type": "auth:success",
  "userId": "user_123"
}
```

---

## Eventos: Client → Server

### `join-room`
Cliente entra em uma sala de chat.

```json
{
  "type": "join-room",
  "roomId": "room_abc123"
}
```

**Resposta (success):**
```json
{
  "type": "room:joined",
  "roomId": "room_abc123",
  "participants": ["user_123", "user_456"]
}
```

**Resposta (error):**
```json
{
  "type": "error",
  "code": "ROOM_NOT_FOUND",
  "message": "Room abc123 does not exist"
}
```

---

### `leave-room`
Cliente sai de uma sala de chat.

```json
{
  "type": "leave-room",
  "roomId": "room_abc123"
}
```

**Resposta:**
```json
{
  "type": "room:left",
  "roomId": "room_abc123"
}
```

---

### `send-message`
Cliente envia uma mensagem na sala.

```json
{
  "type": "send-message",
  "roomId": "room_abc123",
  "content": [
    { "type": "text", "text": "Hello world" }
  ]
}
```

**Resposta (aceita):**
```json
{
  "type": "message:accepted",
  "messageId": "msg_xyz789",
  "roomId": "room_abc123"
}
```

---

## Eventos: Server → Client

### `message:new`
Uma nova mensagem foi criada na sala.

```json
{
  "type": "message:new",
  "roomId": "room_abc123",
  "message": {
    "id": "msg_xyz789",
    "senderId": "user_123",
    "senderType": "user",
    "content": [
      { "type": "text", "text": "Hello world" }
    ],
    "visibility": "all",
    "createdAt": "2026-04-03T12:00:00Z"
  }
}
```

---

### `message:streaming`
Token de streaming de uma resposta de assistente.

```json
{
  "type": "message:streaming",
  "roomId": "room_abc123",
  "messageId": "msg_assistant_001",
  "assistantId": "code-assistant",
  "token": " Hello"
}
```

**Nota:** Múltiplos eventos são enviados sequencialmente até o fim da mensagem.

---

### `message:complete`
Streaming de assistente foi concluído.

```json
{
  "type": "message:complete",
  "roomId": "room_abc123",
  "messageId": "msg_assistant_001",
  "assistantId": "code-assistant"
}
```

---

### `participant:joined`
Um novo participante entrou na sala.

```json
{
  "type": "participant:joined",
  "roomId": "room_abc123",
  "participant": {
    "id": "user_789",
    "name": "Alice",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

---

### `participant:left`
Um participante saiu da sala.

```json
{
  "type": "participant:left",
  "roomId": "room_abc123",
  "participantId": "user_789"
}
```

---

### `assistant:thinking`
Assistente está processando (navegador decidindo ou assistente gerando).

```json
{
  "type": "assistant:thinking",
  "roomId": "room_abc123",
  "assistantId": "general-assistant"
}
```

---

### `error`
Erro genérico.

```json
{
  "type": "error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

**Códigos de erro comuns:**
- `ROOM_NOT_FOUND` — Sala não existe
- `UNAUTHORIZED` — Sem permissão
- `MESSAGE_TOO_LONG` — Mensagem excede limite
- `RATE_LIMIT_EXCEEDED` — Muitas requisições
- `INTERNAL_ERROR` — Erro no servidor

---

## Fluxo Típico

```
1. Client → join-room
2. Server → room:joined
3. Client → send-message
4. Server → message:accepted
5. Server → message:new (broadcast para todos na sala)
6. Server → assistant:thinking (navegador decidindo)
7. Server → message:streaming (tokens do assistente)
8. Server → message:streaming (mais tokens...)
9. Server → message:complete (fim da resposta)
10. Client → leave-room
11. Server → room:left
```

---

## Tipos TypeScript

```typescript
// Client → Server
type ClientEvent =
  | { type: 'auth'; token: string }
  | { type: 'join-room'; roomId: string }
  | { type: 'leave-room'; roomId: string }
  | { type: 'send-message'; roomId: string; content: MessageContent[] }

// Server → Client
type ServerEvent =
  | { type: 'auth:success'; userId: string }
  | { type: 'room:joined'; roomId: string; participants: string[] }
  | { type: 'room:left'; roomId: string }
  | { type: 'message:accepted'; messageId: string; roomId: string }
  | { type: 'message:new'; roomId: string; message: Message }
  | { type: 'message:streaming'; roomId: string; messageId: string; assistantId: string; token: string }
  | { type: 'message:complete'; roomId: string; messageId: string; assistantId: string }
  | { type: 'participant:joined'; roomId: string; participant: Participant }
  | { type: 'participant:left'; roomId: string; participantId: string }
  | { type: 'assistant:thinking'; roomId: string; assistantId: string }
  | { type: 'error'; code: string; message: string }
```

---

**Implementado por:** `apps/api/src/websocket/` (futuro) ou `apps/web/src/services/websocket/` (atual)  
**Consumido por:** `apps/web/src/hooks/use-websocket.ts`
