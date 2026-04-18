# Research: Separação do WebSocket/API (EPIC-002)

**Data**: 2026-04-08
**Fase**: Fase 0 - Pesquisa e Tomada de Decisões

## Visão Geral

Este documento consolida os resultados da pesquisa para migração do servidor WebSocket e rotas de API do Next.js (apps/web) para um serviço Hono independente (apps/api). Todas as decisões técnicas são baseadas nas clarificações arquiteturais já documentadas em spec.md.

## Áreas de Pesquisa

### 1. Melhores Práticas de Next.js Server Actions

**Decisão**: Usar Next.js Server Actions para substituir todas as rotas de API

**Justificativa**:
- **Recurso nativo do Next.js 13+**: Server Actions são a abordagem recomendada para mutações server-side em aplicações Next.js modernas
- **Type safety**: Suporte completo a TypeScript com inferência automática de tipos do servidor para o cliente
- **Sem necessidade de camada de API separada**: Actions executam diretamente no servidor sem necessidade de endpoints REST
- **Integração nativa com formulários**: Funciona perfeitamente com as form actions e useFormState do React 19
- **Progressive enhancement**: Actions podem funcionar sem JavaScript habilitado (formulários enviam via POST)
- **Optimistic updates**: Integra-se naturalmente com o useOptimistic do React para feedback instantâneo na UI

**Alternativas Consideradas**:
1. **Manter rotas REST API**: Manteria o status quo mas vai contra as melhores práticas do Next.js e adiciona camada HTTP desnecessária
2. **tRPC**: Exagero para comunicação interna; Server Actions fornecem type safety similar com menos complexidade
3. **GraphQL**: Pesado demais para este caso de uso; Server Actions são mais simples e performáticos

**Padrão de Implementação**:
```typescript
// apps/web/src/lib/actions/messages.ts
'use server'

import { auth } from '@/auth'
import { getPublisher } from '@multi-llm/platform'
import { messageRepository } from '@multi-llm/db'
import { z } from 'zod'

const SendMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(5000),
})

export async function sendMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const validatedFields = SendMessageSchema.safeParse({
    roomId: formData.get('roomId'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return { error: 'Invalid fields', details: validatedFields.error.flatten() }
  }

  const { roomId, content } = validatedFields.data

  // Save to DB
  const message = await messageRepository.create({
    roomId,
    userId: session.user.id,
    content,
  })

  // Publish to Redis for WebSocket broadcast
  const publisher = getPublisher()
  await publisher.publish('chat.message.sent', {
    messageId: message.id,
    roomId,
    userId: session.user.id,
    content,
    correlationId: crypto.randomUUID(), // For tracing
  })

  return { success: true, message }
}
```

**Padrão de Tratamento de Erros**:
- Retornar erros estruturados como objetos simples (sem lançar exceções)
- Usar discriminated unions: `{ success: true, data } | { error: string, details? }`
- Cliente pode verificar `result.error` antes de usar `result.data`

**Referências**:
- Next.js Server Actions docs: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- React useOptimistic hook: https://react.dev/reference/react/useOptimistic

---

### 2. Padrões de Namespaces e Middleware do Socket.io

**Decisão**: Implementar namespaces dedicados para diferentes preocupações de WebSocket (`/chat`, `/presence`, `/typing`)

**Justificativa**:
- **Separação de responsabilidades**: Diferentes tipos de eventos (mensagens de chat, presença, indicadores de digitação) têm regras de autorização e limites de taxa diferentes
- **Assinaturas seletivas**: Clientes conectam apenas aos namespaces necessários, reduzindo tráfego desnecessário de eventos
- **Escalonamento independente**: Pode otimizar ou escalar namespaces independentemente baseado nos padrões de uso
- **Permissões mais claras**: Cada namespace pode ter sua própria cadeia de middleware para autenticação e limitação de taxa

**Estrutura de Namespaces**:

```typescript
// apps/api/src/websocket/namespaces/chat.ts
export function configureChatNamespace(io: Server) {
  const chatNs = io.of('/chat')
  
  chatNs.use(sessionMiddleware) // Validate JWT token
  chatNs.use(roomAuthMiddleware) // Verify user has access to room
  
  chatNs.on('connection', (socket) => {
    const { roomId } = socket.data
    
    socket.join(`room:${roomId}`)
    
    socket.on('message:send', async (data) => {
      // Handled by Server Actions, this is just for typing indicators
    })
  })
}
```

**Padrão de Middleware**:
```typescript
// apps/api/src/websocket/middleware/session.ts
export const sessionMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token
  
  if (!token) {
    return next(new Error('Authentication token required'))
  }
  
  try {
    // Verify JWT using NEXTAUTH_SECRET
    const decoded = await verifyJWT(token, process.env.NEXTAUTH_SECRET!)
    socket.data.userId = decoded.sub
    socket.data.sessionId = decoded.sessionId
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
}
```

**Alternativas Consideradas**:
1. **Namespace único com prefixos de eventos**: Mais simples mas dificulta aplicar regras diferentes de middleware/autenticação
2. **Separação apenas baseada em rooms**: Misturaria diferentes responsabilidades no mesmo namespace
3. **Um socket por feature**: Overhead demais, namespaces fornecem separação mais limpa

**Referências**:
- Socket.io namespaces: https://socket.io/docs/v4/namespaces/
- Socket.io middleware: https://socket.io/docs/v4/middlewares/

---

### 3. Validação JWT para Handshakes WebSocket

**Decisão**: Usar validação de token JWT com NEXTAUTH_SECRET compartilhado entre apps/web e apps/api

**Justificativa**:
- **Reutiliza infraestrutura de autenticação existente**: NextAuth já emite tokens JWT, não é necessário novo sistema de autenticação
- **Validação stateless**: apps/api pode validar tokens sem consultar banco de dados ou Redis em cada conexão
- **Baixa latência**: Validação JWT é <10ms, atende ao requisito de handshake <50ms
- **Seguro**: Tokens são assinados com HS256/RS256, não podem ser falsificados sem a secret
- **Abordagem padrão**: JWT é padrão da indústria para autenticação stateless

**Implementação**:
```typescript
// apps/api/src/middlewares/auth.ts
import * as jose from 'jose'

export async function verifyJWT(token: string, secret: string) {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)
  
  const { payload } = await jose.jwtVerify(token, secretKey, {
    algorithms: ['HS256'],
  })
  
  return {
    sub: payload.sub as string,
    sessionId: payload.sessionId as string,
    exp: payload.exp,
  }
}
```

**Transmissão do Token**:
- **Opção 1 (Recomendada)**: `socket.handshake.auth.token` - mais limpa, suportada pelo cliente Socket.io
- **Opção 2 (Fallback)**: Query parameter `?token=...` - funciona com clientes antigos mas menos segura (registrada em proxies)

**Client-side**:
```typescript
// apps/web/src/hooks/use-websocket.ts
const socket = io('http://localhost:4000/chat', {
  auth: {
    token: session?.accessToken, // NextAuth session token
  },
})
```

**Alternativas Consideradas**:
1. **Session ID em cookies**: Requer que apps/api consulte Redis em cada conexão (adiciona latência)
2. **Autenticação via API key**: Não é específica do usuário, necessitaria lookup separado do usuário
3. **Fluxo OAuth2**: Exagero, adiciona complexidade sem benefício

**Notas de Segurança**:
- NEXTAUTH_SECRET deve ser o mesmo em ambas as apps (compartilhado via variável de ambiente)
- Tokens devem ter expiração razoável (padrão NextAuth: 30 dias para sessão, 30min para access token)
- Middleware WebSocket deve rejeitar tokens expirados
- Considerar implementar refresh de token se usar access tokens de curta duração

**Referências**:
- NextAuth JWT configuration: https://next-auth.js.org/configuration/options#jwt
- jose library for JWT: https://github.com/panva/jose

---

### 4. Propagação de Correlation ID para Rastreamento Distribuído

**Decisão**: Gerar correlation IDs em Server Actions e propagar através de eventos Redis para handlers WebSocket com logging JSON estruturado

**Justificativa**:
- **Rastreabilidade ponta a ponta**: Pode rastrear uma única operação através de Server Action → Redis → WebSocket → Cliente
- **Depuração de sistemas distribuídos**: Quando uma mensagem falha na entrega, correlation ID vincula todas as entradas de log
- **Análise de performance**: Medir latência total desde invocação da action até recebimento no cliente
- **Prática padrão**: Correlation IDs são padrão da indústria para observabilidade de microserviços

**Padrão de Implementação**:

```typescript
// 1. Server Action generates correlation ID
export async function sendMessage(formData: FormData) {
  const correlationId = crypto.randomUUID()
  
  logger.info('Server Action started', { correlationId, action: 'sendMessage' })
  
  const message = await messageRepository.create({ /* ... */ })
  
  await publisher.publish('chat.message.sent', {
    messageId: message.id,
    correlationId, // Include in payload
    // ... other fields
  })
  
  logger.info('Message saved and published', { correlationId, messageId: message.id })
  return { success: true, correlationId } // Return to client for reference
}

// 2. Redis subscriber receives event with correlation ID
subscriber.subscribe('chat.message.sent', async (envelope) => {
  const { correlationId } = envelope.payload
  
  logger.info('Redis event received', { correlationId, event: 'chat.message.sent' })
  
  // 3. WebSocket broadcasts with correlation ID
  io.to(`room:${envelope.payload.roomId}`).emit('message:new', {
    ...envelope.payload,
    correlationId,
  })
  
  logger.info('WebSocket broadcast complete', { correlationId })
})
```

**Formato de Logging Estruturado**:
```json
{
  "timestamp": "2026-04-08T10:30:15.123Z",
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "component": "server-action",
  "action": "sendMessage",
  "userId": "user:123",
  "roomId": "room:456",
  "latencyMs": 45
}
```

**Biblioteca de Logging**: Usar `pino` para logging JSON estruturado (rápido, baixo overhead)

**Alternativas Consideradas**:
1. **Sem correlation IDs**: Impossível rastrear operações multi-hop nos logs
2. **Apenas Request IDs**: Não cobre o fluxo assíncrono de Pub/Sub
3. **Instrumentação completa com OpenTelemetry**: Pesado demais para necessidades atuais, correlation IDs são suficientes

**Referências**:
- Correlation ID pattern: https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html
- Pino logging: https://github.com/pinojs/pino

---

### 5. Degradação Graciosa e Optimistic Updates

**Decisão**: Implementar local echo + optimistic updates quando WebSocket ou Redis estiverem indisponíveis

**Justificativa**:
- **Melhor UX**: Usuário vê sua mensagem imediatamente mesmo se WebSocket estiver fora do ar
- **Resiliência**: Sistema permanece parcialmente funcional durante falhas de infraestrutura
- **Consistência eventual**: Mensagens são persistidas no BD, sincronizarão quando serviços recuperarem
- **Mobile-friendly**: Funciona bem com conexões instáveis (transições 3G/4G/WiFi)

**Padrão de Implementação**:

```typescript
// Client-side optimistic update
'use client'

import { useOptimistic } from 'react'

export function ChatMessages({ initialMessages }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state, newMessage) => [...state, newMessage]
  )
  
  async function handleSendMessage(formData: FormData) {
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: formData.get('content'),
      userId: session.user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    
    // Immediately show in UI
    addOptimisticMessage(tempMessage)
    
    // Send to server
    const result = await sendMessage(formData)
    
    if (result.error) {
      // Show error state
      toast.error('Failed to send message')
    }
    
    // Server Action saved to DB, Redis will broadcast if available
    // If Redis is down, other users won't see until they refresh
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

**Recuperação de Erros**:
- Se Server Action falhar: Mostrar erro, remover mensagem otimista
- Se Server Action ter sucesso mas Redis falhar: Mensagem persistida mas não broadcast (consistência eventual)
- Se WebSocket estiver fora: Fallback para polling/refresh (pode implementar long polling como fallback)

**Indicadores**:
- Mostrar spinner "pendente" em mensagens otimistas
- Mostrar checkmark "enviado" quando WebSocket confirmar entrega
- Mostrar indicador "offline" se WebSocket desconectado

**Alternativas Consideradas**:
1. **Fail hard**: Melhor mostrar algo do que nada
2. **Espera síncrona pelo broadcast**: Derrota o propósito de optimistic updates
3. **Sem optimistic updates**: UX ruim, parece lento

**Referências**:
- React useOptimistic: https://react.dev/reference/react/useOptimistic
- Optimistic UI patterns: https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces/

---

### 6. Nomenclatura de Canais Redis Pub/Sub e Schemas

**Decisão**: Usar nomes de canais hierárquicos com payloads tipados

**Padrão**: `{domain}.{entity}.{event}` (ex: `chat.message.sent`, `room.member.joined`)

**Justificativa**:
- **Hierarquia clara**: Fácil entender o que cada canal faz
- **Assinaturas com wildcard**: Pode assinar `chat.*` para todos os eventos de chat
- **Versionamento**: Pode adicionar `v1.chat.message.sent` se schema mudar
- **Type safety**: Cada canal tem um tipo de payload TypeScript definido

**Definições de Canais**:

```typescript
// packages/maintenance/src/pubsub/channels.ts
export const CHANNELS = {
  CHAT: {
    MESSAGE_SENT: 'chat.message.sent',
    MESSAGE_UPDATED: 'chat.message.updated',
    MESSAGE_DELETED: 'chat.message.deleted',
  },
  ROOM: {
    MEMBER_JOINED: 'room.member.joined',
    MEMBER_LEFT: 'room.member.left',
  },
  PRESENCE: {
    STATUS_CHANGED: 'user.presence.changed',
  },
} as const
```

**Schemas de Payload**:
```typescript
// packages/maintenance/src/pubsub/types.ts
export interface MessageSentPayload {
  messageId: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  correlationId: string
}

export interface PubSubEnvelope<T> {
  channel: string
  type: string
  payload: T
  timestamp: string
  correlationId: string
}
```

**Alternativas Consideradas**:
1. **Nomenclatura plana** (`message_sent`): Mais difícil de organizar, sem hierarquia
2. **Topic exchanges** (estilo RabbitMQ): Redis não suporta, precisaria de tecnologia diferente
3. **Canal único com tipos de mensagem**: Mais difícil filtrar, todos os assinantes recebem todos os eventos

---

### 7. Gerenciamento do Ciclo de Vida da Conexão WebSocket

**Decisão**: Implementar graceful shutdown, reconexão com exponential backoff, e re-assinatura de rooms na reconexão

**Ciclo de Vida da Conexão**:

1. **Conexão Inicial**:
   - Cliente conecta com token JWT
   - Servidor valida token no middleware
   - Cliente entra no namespace da room

2. **Cenários de Desconexão**:
   - Falha de rede: Cliente reconecta automaticamente com exponential backoff
   - Shutdown do servidor: Servidor emite evento "disconnect", cliente reconecta à nova instância
   - Expiração do token: Servidor desconecta, cliente deve renovar token e reconectar

3. **Graceful Shutdown** (apps/api):
```typescript
process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...')
  
  // Stop accepting new connections
  io.close()
  
  // Send disconnect warning to all clients
  io.emit('server:shutting-down', { reconnectIn: 5000 })
  
  // Wait for clients to disconnect
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Cleanup
  await shutdownRedis()
  process.exit(0)
})
```

4. **Reconexão do Cliente**:
```typescript
const socket = io('http://localhost:4000/chat', {
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
})

socket.on('connect', () => {
  // Re-join rooms
  socket.emit('room:join', { roomId })
})

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server kicked us out, token expired?
    refreshTokenAndReconnect()
  }
})
```

**Alternativas Consideradas**:
1. **Sem graceful shutdown**: Clientes perdem conexão abruptamente durante deploys
2. **Reconexão manual**: UX ruim, Socket.io lida bem com isso
3. **Conexões persistentes através de deploys**: Não viável sem sticky sessions

---

## Resumo de Escolhas Tecnológicas

| Preocupação | Tecnologia/Padrão | Justificativa |
|---------|-------------------|---------------|
| Mutações backend | Next.js Server Actions | Recurso nativo do Next.js, type-safe, sem necessidade de camada REST |
| Biblioteca WebSocket | Socket.io 4.8.3 | Já em uso, madura, suporte a namespaces |
| Autenticação WebSocket | Validação de token JWT | Stateless, baixa latência (<50ms), reutiliza NextAuth |
| Comunicação entre serviços | Redis Pub/Sub | Já implementado (EPIC-003), desacopla serviços |
| Rastreamento | Correlation IDs + structured logging | Padrão da indústria para sistemas distribuídos |
| Logging | Pino (JSON estruturado) | Rápido, baixo overhead, saída JSON para agregação de logs |
| Degradação graciosa | Optimistic updates + local echo | Melhor UX, consistência eventual |
| Tratamento de erros | Discriminated unions | Type-safe, estados de sucesso/erro claros |

---

## Mitigação de Riscos

1. **Redis Single Point of Failure**:
   - Mitigação: Degradação graciosa, local echo, consistência eventual
   - Futuro: Redis Sentinel ou Redis Cluster para HA

2. **Expiração de Token JWT Durante Sessão**:
   - Mitigação: Implementar refresh de token no middleware WebSocket
   - Futuro: Usar access tokens de curta duração com refresh tokens

3. **Escalabilidade do WebSocket**:
   - Mitigação: Começar com meta de 1000 conexões, adicionar adaptador Redis para multi-instância depois
   - Futuro: Adaptador Redis do Socket.io para escalonamento horizontal

4. **Mensagens Perdidas Durante Deployment**:
   - Mitigação: Graceful shutdown, reconexão do cliente, persistência de mensagens no BD
   - Futuro: Fila de mensagens para entrega garantida

---

## Questões Abertas (Resolvidas na Spec)

Todas as clarificações foram resolvidas em spec.md:

1. ✅ **Comunicação Server Actions → WebSocket**: Redis Pub/Sub (clarificação #1)
2. ✅ **Autenticação WebSocket**: Validação de token JWT com NEXTAUTH_SECRET compartilhado (clarificação #2)
3. ✅ **Degradação graciosa quando apps/api está fora**: Optimistic updates (clarificação #3)
4. ✅ **Tratamento de falha do Redis**: Local echo + consistência eventual (clarificação #4)
5. ✅ **Rastreamento distribuído**: Correlation IDs com structured logging (clarificação #5)

---

## Próximos Passos

Com a pesquisa completa, prosseguir para **Fase 1: Design & Contratos**:

1. Definir modelo de dados (entidades, transições de estado)
2. Documentar contratos de API WebSocket (namespaces, eventos, fluxo de autenticação)
3. Documentar contratos de Server Actions (assinaturas de funções, tipos de erro)
4. Documentar schemas de eventos Redis (canais, tipos de payload)
5. Criar guia quickstart para desenvolvedores

