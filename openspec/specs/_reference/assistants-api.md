# Assistants API Contract

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

### `GET /api/assistants`

Lista todos os assistentes disponíveis.

**Request:**
```http
GET /api/assistants
Authorization: Session cookie
```

**Query params:**
- `online`: "true" para filtrar apenas assistentes online (opcional)

**Response 200 (todos):**
```json
{
  "assistants": [
    {
      "id": "general-assistant",
      "name": "General Assistant",
      "description": "General purpose assistant",
      "avatarUrl": "/avatars/general.png",
      "endpoint": "http://localhost:11434",
      "status": "online"
    },
    {
      "id": "code-assistant",
      "name": "Code Assistant",
      "description": "Specialized in programming",
      "avatarUrl": "/avatars/code.png",
      "endpoint": "http://localhost:11435",
      "status": "online"
    },
    {
      "id": "creative-assistant",
      "name": "Creative Assistant",
      "description": "Creative writing and brainstorming",
      "avatarUrl": "/avatars/creative.png",
      "endpoint": "http://localhost:11436",
      "status": "offline"
    }
  ]
}
```

**Response 200 (apenas online):**
```http
GET /api/assistants?online=true
```
```json
{
  "assistants": [
    {
      "id": "general-assistant",
      "name": "General Assistant",
      "description": "General purpose assistant",
      "avatarUrl": "/avatars/general.png",
      "endpoint": "http://localhost:11434",
      "status": "online"
    },
    {
      "id": "code-assistant",
      "name": "Code Assistant",
      "description": "Specialized in programming",
      "avatarUrl": "/avatars/code.png",
      "endpoint": "http://localhost:11435",
      "status": "online"
    }
  ]
}
```

---

### `GET /api/assistants/health`

Verifica o health status de todos os assistentes e atualiza seus status.

**Request:**
```http
GET /api/assistants/health
```

**Comportamento:**
- Faz ping em cada endpoint Ollama (`/api/tags`)
- Timeout de 3 segundos por assistente
- Verifica se o assistente tem pelo menos 1 modelo instalado
- Atualiza o status do assistente automaticamente

**Response 200:**
```json
{
  "health": {
    "general-assistant": {
      "id": "general-assistant",
      "status": "online",
      "hasModel": true
    },
    "code-assistant": {
      "id": "code-assistant",
      "status": "online",
      "hasModel": true
    },
    "creative-assistant": {
      "id": "creative-assistant",
      "status": "offline",
      "hasModel": false
    }
  }
}
```

**Health check logic:**
```typescript
// Status online se:
// - Endpoint responde em < 3s
// - Resposta OK (200)
// - Tem pelo menos 1 modelo instalado

// Status offline se:
// - Timeout (> 3s)
// - Erro de conexão
// - Sem modelos instalados
```

**Nota:** Este endpoint NÃO requer autenticação (pode ser chamado publicamente para monitoring).

---

## Tipos TypeScript

```typescript
interface Assistant {
  id: string
  name: string
  description: string
  avatarUrl?: string
  endpoint: string
  status: 'online' | 'offline' | 'busy'
}

interface AssistantHealth {
  id: string
  status: 'online' | 'offline' | 'busy'
  hasModel: boolean
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `401` | Não autenticado (apenas `/api/assistants`) |
| `500` | Erro interno do servidor |

---

## Exemplos de Uso

### Listar todos os assistentes

```typescript
const response = await fetch('/api/assistants', {
  credentials: 'include'
})
const { assistants } = await response.json()
```

### Listar apenas assistentes online

```typescript
const response = await fetch('/api/assistants?online=true', {
  credentials: 'include'
})
const { assistants } = await response.json()
```

### Verificar health de assistentes

```typescript
const response = await fetch('/api/assistants/health')
const { health } = await response.json()

// Verificar status de um assistente específico
const generalStatus = health['general-assistant']
if (generalStatus.status === 'online' && generalStatus.hasModel) {
  console.log('General assistant está pronto')
}
```

---

**Implementado por:** `apps/web/src/app/api/assistants/`  
**Consumido por:** Frontend Next.js (Server Components + Client Components)
