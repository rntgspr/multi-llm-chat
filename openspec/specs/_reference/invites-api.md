# Invites API Contract

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

### `POST /api/invites`

Cria um convite para uma sala.

**Request:**
```http
POST /api/invites
Content-Type: application/json
Authorization: Session cookie

{
  "roomId": "room_abc123",
  "expiresInHours": 24,     // opcional
  "maxUses": 10             // opcional
}
```

**Validação:**
- `roomId`: string (obrigatório)
- `expiresInHours`: número (opcional) — convite expira após N horas
- `maxUses`: número (opcional) — convite pode ser usado no máximo N vezes

**Response 201:**
```json
{
  "invite": {
    "id": "invite_xyz789",
    "roomId": "room_abc123",
    "code": "abc123def456",
    "createdBy": "user_123",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "expiresAt": "2026-04-08T12:00:00.000Z",  // se expiresInHours fornecido
    "usesRemaining": 10                        // se maxUses fornecido
  },
  "inviteUrl": "http://localhost:3000/join/abc123def456"
}
```

**Response 400 (validação):**
```json
{
  "error": "Invalid data",
  "details": [
    {
      "path": ["roomId"],
      "message": "Required"
    }
  ]
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

**Nota:** Apenas participantes da sala podem criar convites.

---

### `GET /api/invites/[code]`

Obtém informações de um convite sem usá-lo (preview).

**Request:**
```http
GET /api/invites/abc123def456
```

**Response 200 (convite válido):**
```json
{
  "valid": true,
  "roomId": "room_abc123",
  "expiresAt": "2026-04-08T12:00:00.000Z",  // se aplicável
  "usesRemaining": 8                         // se aplicável
}
```

**Response 404 (não encontrado):**
```json
{
  "error": "Invite not found or expired"
}
```

**Response 410 (expirado):**
```json
{
  "error": "Invite expired"
}
```

**Response 410 (sem usos restantes):**
```json
{
  "error": "Invite exhausted"
}
```

**Nota:** Este endpoint NÃO requer autenticação (permite preview antes de login).

---

### `POST /api/invites/[code]`

Usa um convite para entrar na sala.

**Request:**
```http
POST /api/invites/abc123def456
Authorization: Session cookie
```

**Response 200 (sucesso):**
```json
{
  "success": true,
  "room": {
    "id": "room_abc123",
    "name": "My Room",
    "createdBy": "user_456",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "participants": ["user_456", "user_123"],
    "assistants": ["general-assistant"]
  },
  "message": "You joined room \"My Room\""
}
```

**Response 400 (convite inválido/expirado/esgotado):**
```json
{
  "error": "Invalid, expired, or exhausted invite"
}
```

**Comportamento:**
1. Valida convite (existe, não expirado, tem usos restantes)
2. Adiciona usuário aos participantes da sala
3. Decrementa `usesRemaining` (se aplicável)
4. Retorna sala atualizada

**Nota:** Um usuário pode usar o mesmo convite múltiplas vezes se já for participante (operação idempotente).

---

## Tipos TypeScript

```typescript
interface Invite {
  id: string
  roomId: string
  code: string
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  usesRemaining?: number
}

interface InvitePreview {
  valid: boolean
  roomId: string
  expiresAt?: Date
  usesRemaining?: number
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Dados inválidos ou convite inválido/expirado/esgotado |
| `401` | Não autenticado (apenas POST endpoints) |
| `403` | Sem permissão para criar convite |
| `404` | Sala ou convite não encontrado |
| `410` | Convite expirado ou sem usos restantes |
| `500` | Erro interno do servidor |

---

## Exemplos de Uso

### Criar convite sem expiração

```typescript
const response = await fetch('/api/invites', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'room_abc123'
  })
})
const { invite, inviteUrl } = await response.json()
```

### Criar convite com expiração e limite de usos

```typescript
const response = await fetch('/api/invites', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'room_abc123',
    expiresInHours: 24,
    maxUses: 10
  })
})
const { invite, inviteUrl } = await response.json()
// inviteUrl = "http://localhost:3000/join/abc123def456"
```

### Preview de convite

```typescript
const response = await fetch('/api/invites/abc123def456')
const preview = await response.json()

if (preview.valid) {
  console.log(`Convite para sala: ${preview.roomId}`)
  console.log(`Expira em: ${preview.expiresAt}`)
  console.log(`Usos restantes: ${preview.usesRemaining}`)
}
```

### Usar convite para entrar na sala

```typescript
const response = await fetch('/api/invites/abc123def456', {
  method: 'POST',
  credentials: 'include'
})
const { success, room, message } = await response.json()

if (success) {
  console.log(message) // "You joined room \"My Room\""
  // Redirecionar para /rooms/room_abc123
}
```

---

## Fluxo Típico

```
1. Usuário cria sala
2. Usuário cria convite via POST /api/invites
3. Usuário compartilha inviteUrl (http://localhost:3000/join/abc123def456)
4. Outro usuário acessa /join/abc123def456
5. Frontend chama GET /api/invites/abc123def456 (preview)
6. Frontend mostra "Você foi convidado para sala X"
7. Usuário clica "Entrar"
8. Frontend chama POST /api/invites/abc123def456
9. Usuário é adicionado à sala
10. Redirect para /rooms/room_abc123
```

---

**Implementado por:** `apps/web/src/app/api/invites/`  
**Consumido por:** Frontend Next.js (Server Components + Client Components)
