# Rooms API Contract

**Versão:** 1.0  
**Última atualização:** 2026-04-07

---

## Autenticação

Todos os endpoints requerem autenticação via sessão NextAuth.

**Resposta 401 (não autenticado):**
```json
{
  "error": "Not authenticated"
}
```

---

## Endpoints

### `GET /api/rooms`

Lista todas as salas do usuário autenticado.

**Request:**
```http
GET /api/rooms
Authorization: Session cookie
```

**Response 200:**
```json
{
  "rooms": [
    {
      "id": "room_abc123",
      "name": "My Room",
      "createdBy": "user_123",
      "createdAt": "2026-04-07T12:00:00.000Z",
      "participants": ["user_123", "user_456"],
      "assistants": ["general-assistant", "code-assistant"]
    }
  ]
}
```

---

### `POST /api/rooms`

Cria uma nova sala.

**Request:**
```http
POST /api/rooms
Content-Type: application/json

{
  "name": "My New Room",
  "assistants": ["general-assistant"]  // opcional, default: []
}
```

**Validação:**
- `name`: string, min 1, max 100 caracteres (obrigatório)
- `assistants`: array de strings (opcional)

**Response 201:**
```json
{
  "room": {
    "id": "room_xyz789",
    "name": "My New Room",
    "createdBy": "user_123",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "participants": ["user_123"],
    "assistants": ["general-assistant"]
  }
}
```

**Response 400 (validação falhou):**
```json
{
  "error": "Invalid data",
  "details": [
    {
      "path": ["name"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

---

### `GET /api/rooms/[roomId]`

Obtém detalhes de uma sala específica.

**Request:**
```http
GET /api/rooms/room_abc123
Authorization: Session cookie
```

**Response 200:**
```json
{
  "room": {
    "id": "room_abc123",
    "name": "My Room",
    "createdBy": "user_123",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "participants": ["user_123", "user_456"],
    "assistants": ["general-assistant", "code-assistant"]
  }
}
```

**Response 403 (sem permissão):**
```json
{
  "error": "Access denied"
}
```

**Response 404 (sala não encontrada):**
```json
{
  "error": "Room not found"
}
```

---

### `DELETE /api/rooms/[roomId]`

Deleta uma sala (apenas criador).

**Request:**
```http
DELETE /api/rooms/room_abc123
Authorization: Session cookie
```

**Response 200:**
```json
{
  "success": true
}
```

**Response 403 (não é criador):**
```json
{
  "error": "Only creator can delete room"
}
```

**Response 404:**
```json
{
  "error": "Room not found"
}
```

---

### `PATCH /api/rooms/[roomId]`

Adiciona ou remove assistentes de uma sala.

**Request (adicionar):**
```http
PATCH /api/rooms/room_abc123
Content-Type: application/json

{
  "action": "add",
  "assistantId": "creative-assistant"
}
```

**Request (remover):**
```http
PATCH /api/rooms/room_abc123
Content-Type: application/json

{
  "action": "remove",
  "assistantId": "code-assistant"
}
```

**Validação:**
- `action`: "add" | "remove" (obrigatório)
- `assistantId`: string (obrigatório)

**Response 200:**
```json
{
  "room": {
    "id": "room_abc123",
    "name": "My Room",
    "createdBy": "user_123",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "participants": ["user_123", "user_456"],
    "assistants": ["general-assistant", "creative-assistant"]
  }
}
```

**Response 400 (ação falhou):**
```json
{
  "error": "Failed to update assistants"
}
```

**Response 403:**
```json
{
  "error": "Access denied"
}
```

---

### `GET /api/rooms/[roomId]/messages`

Lista mensagens de uma sala (paginado).

**Request:**
```http
GET /api/rooms/room_abc123/messages?page=1&limit=50&since=2026-04-07T12:00:00.000Z
Authorization: Session cookie
```

**Query params:**
- `page`: número da página (opcional, default: 1)
- `limit`: mensagens por página (opcional, default: 50)
- `since`: filtrar mensagens após esta data ISO 8601 (opcional)

**Response 200:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "roomId": "room_abc123",
      "senderId": "user_123",
      "senderType": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello world"
        }
      ],
      "visibility": "public",
      "createdAt": "2026-04-07T12:00:00.000Z"
    },
    {
      "id": "msg_124",
      "roomId": "room_abc123",
      "senderId": "general-assistant",
      "senderType": "assistant",
      "content": [
        {
          "type": "text",
          "text": "Hi! How can I help?"
        }
      ],
      "visibility": "public",
      "createdAt": "2026-04-07T12:00:05.000Z"
    }
  ]
}
```

**Response 403:**
```json
{
  "error": "Access denied"
}
```

**Response 404:**
```json
{
  "error": "Room not found"
}
```

**Nota:** Retorna apenas mensagens públicas (`visibility: 'public'`).

---

### `POST /api/rooms/[roomId]/messages`

Envia uma mensagem na sala e aciona resposta de assistentes.

**Request:**
```http
POST /api/rooms/room_abc123/messages
Content-Type: application/json

{
  "content": [
    {
      "type": "text",
      "text": "Can you help me with Python?"
    }
  ]
}
```

**Tipos de conteúdo suportados:**

```typescript
// Texto
{
  "type": "text",
  "text": "Message text"
}

// Imagem
{
  "type": "image",
  "url": "https://example.com/image.jpg",
  "altText": "Description",  // opcional
  "width": 800,             // opcional
  "height": 600             // opcional
}

// Arquivo
{
  "type": "file",
  "url": "https://example.com/file.pdf",
  "fileName": "document.pdf",
  "sizeBytes": 1024,
  "mimeType": "application/pdf"
}
```

**Validação:**
- `content`: array com pelo menos 1 item (obrigatório)
- Cada item deve ter `type` válido e campos obrigatórios

**Response 201:**
```json
{
  "message": {
    "id": "msg_xyz",
    "roomId": "room_abc123",
    "senderId": "user_123",
    "senderType": "user",
    "content": [
      {
        "type": "text",
        "text": "Can you help me with Python?"
      }
    ],
    "visibility": "public",
    "createdAt": "2026-04-07T12:00:00.000Z"
  },
  "routing": {
    "assistants": ["code-assistant"],
    "reasoning": "Message mentions Python programming language",
    "shouldBlock": true
  },
  "assistantResponses": [
    {
      "assistantId": "code-assistant",
      "message": {
        "id": "msg_abc",
        "roomId": "room_abc123",
        "senderId": "code-assistant",
        "senderType": "assistant",
        "content": [
          {
            "type": "text",
            "text": "Sure! I'd be happy to help with Python. What do you need?"
          }
        ],
        "visibility": "public",
        "createdAt": "2026-04-07T12:00:03.000Z"
      },
      "content": "Sure! I'd be happy to help with Python. What do you need?"
    }
  ]
}
```

**Response 400 (validação):**
```json
{
  "error": "Invalid data",
  "details": [
    {
      "path": ["content"],
      "message": "Array must contain at least 1 element(s)"
    }
  ]
}
```

**Response 403:**
```json
{
  "error": "Access denied"
}
```

**Response 404:**
```json
{
  "error": "Room not found"
}
```

**Comportamento:**
1. Salva a mensagem do usuário
2. Consulta o Navigator para decidir qual assistente deve responder
3. Chama os assistentes selecionados sequencialmente
4. Salva as respostas dos assistentes
5. Retorna mensagem do usuário + roteamento + respostas

**Nota:** Assistentes são acionados em sequência (não paralelo). Se um assistente falhar, o erro é incluído em `assistantResponses`.

---

## Tipos TypeScript

```typescript
interface Room {
  id: string
  name: string
  createdBy: string
  createdAt: Date
  participants: string[]
  assistants: string[]
  activeInvite?: Invite
}

interface Message {
  id: string
  roomId: string
  senderId: string
  senderType: 'user' | 'assistant' | 'navigator'
  content: MessageContent[]
  visibility: 'public' | 'hidden'
  recipientId?: string
  createdAt: Date
}

type MessageContent = TextContent | ImageContent | FileContent

interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image'
  url: string
  altText?: string
  width?: number
  height?: number
}

interface FileContent {
  type: 'file'
  url: string
  fileName: string
  sizeBytes: number
  mimeType: string
}

interface RoutingPlan {
  assistants: string[]
  reasoning: string
  shouldBlock: boolean
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Dados inválidos (validação Zod falhou) |
| `401` | Não autenticado |
| `403` | Sem permissão para acessar/modificar recurso |
| `404` | Sala não encontrada |
| `500` | Erro interno do servidor |

---

**Implementado por:** `apps/web/src/app/api/rooms/`  
**Consumido por:** Frontend Next.js (Server Components + Client Components)
