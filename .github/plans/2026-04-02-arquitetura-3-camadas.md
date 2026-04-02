# Refatoração: Arquitetura em 3 Camadas + Monorepo

## Status: EM PROGRESSO 🚧

**Última atualização:** 2026-04-02

---

## Objetivo

Reorganizar o código em:
1. **Monorepo com Turborepo** - apps/ + packages/
2. **3 camadas bem definidas** como packages compartilhados

---

## Requisitos Confirmados

- ✅ **Streaming** token por token (como ChatGPT)
- ✅ **Navegador invisível** - decisões não aparecem no chat (exceto modo debug)
- ✅ **Sequencial** - navegador pode chamar múltiplos assistentes em sequência, bloqueando input do usuário
- ✅ **Multi-canal** - arquitetura preparada para futuros conectores (WhatsApp, Telegram, Messenger, etc.)
- ✅ **Monorepo** - Turborepo com apps/ + packages/
- ✅ **Apps** - web (Next.js) + api (backend separado) + workers (background jobs)

---

## Progresso

### Fase 0: Setup Monorepo ✅
- [x] Instalar Turborepo
- [x] Criar estrutura de pastas
- [x] Configurar turbo.json
- [x] Atualizar pnpm-workspace.yaml
- [x] Mover código para apps/web

### Fase 1: Packages ✅
- [x] @multi-llm/types - Tipos compartilhados
- [x] @multi-llm/interaction - Camada de Interação
- [x] @multi-llm/interpretation - Camada de Interpretação
- [x] @multi-llm/maintenance - Camada de Manutenção
- [ ] @multi-llm/db - Database (quando adicionar)
- [ ] @multi-llm/ui - Componentes UI (extrair depois)

### Fase 2: Apps ✅
- [x] apps/web - Next.js (código existente migrado)
- [x] apps/api - Hono (estrutura básica)
- [x] apps/workers - Background jobs (placeholder)

### Fase 3: Integração (PRÓXIMO)
- [ ] Atualizar apps/web para usar packages
- [ ] Migrar services/ existentes para packages
- [ ] Conectar camadas via Message Bus
- [ ] Implementar streaming real

---

## Estrutura do Monorepo

```
multi-llm-chat/
├── apps/
│   ├── web/                      # Next.js - Frontend + SSR
│   │   ├── src/
│   │   │   ├── app/              # App Router pages
│   │   │   ├── components/       # UI components
│   │   │   └── hooks/            # React hooks
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── api/                      # Backend API (Hono/Fastify/Express)
│   │   ├── src/
│   │   │   ├── routes/           # API routes
│   │   │   ├── middleware/       # Auth, logging, etc.
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── workers/                  # Background jobs
│       ├── src/
│       │   ├── jobs/             # Job definitions
│       │   │   ├── process-message.ts
│       │   │   └── cleanup.ts
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── interaction/              # CAMADA DE INTERAÇÃO
│   │   ├── src/
│   │   │   ├── channels/         # Abstração multi-canal
│   │   │   │   ├── channel.ts
│   │   │   │   ├── channel-manager.ts
│   │   │   │   └── web-channel.ts
│   │   │   ├── chat/
│   │   │   │   ├── message-store.ts
│   │   │   │   ├── message-bus.ts
│   │   │   │   └── stream-handler.ts
│   │   │   └── index.ts
│   │   └── package.json          # @multi-llm/interaction
│   │
│   ├── interpretation/           # CAMADA DE INTERPRETAÇÃO
│   │   ├── src/
│   │   │   ├── navigator/
│   │   │   │   ├── navigator.ts
│   │   │   │   ├── routing-rules.ts
│   │   │   │   └── llm-router.ts
│   │   │   ├── assistants/
│   │   │   │   ├── registry.ts
│   │   │   │   └── ollama-adapter.ts
│   │   │   ├── context/
│   │   │   │   └── context-builder.ts
│   │   │   └── index.ts
│   │   └── package.json          # @multi-llm/interpretation
│   │
│   ├── maintenance/              # CAMADA DE MANUTENÇÃO
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   └── session.ts
│   │   │   ├── users/
│   │   │   │   └── user-manager.ts
│   │   │   ├── rooms/
│   │   │   │   └── room-manager.ts
│   │   │   ├── config/
│   │   │   │   └── feature-flags.ts
│   │   │   └── index.ts
│   │   └── package.json          # @multi-llm/maintenance
│   │
│   ├── types/                    # Tipos compartilhados
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json          # @multi-llm/types
│   │
│   ├── db/                       # Database client + migrations
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── drizzle/              # Migrations
│   │   └── package.json          # @multi-llm/db
│   │
│   └── ui/                       # Componentes UI compartilhados
│       ├── src/
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   └── index.ts
│       └── package.json          # @multi-llm/ui
│
├── tooling/                      # Configs compartilhadas
│   ├── eslint/
│   ├── typescript/
│   └── biome/
│
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml
├── package.json
└── .github/
    └── plans/
```

---

## Apps

### web (Next.js)

Frontend + Server Components. Consome packages.

```typescript
// apps/web/src/app/chat/page.tsx
import { MessageBus } from '@multi-llm/interaction'
import { RoomManager } from '@multi-llm/maintenance'
```

### api (Backend)

API REST/WebSocket separada. Opções de framework:
- **Hono** (leve, edge-ready)
- **Fastify** (rápido, plugins)
- **Express** (familiar)

```typescript
// apps/api/src/routes/chat.ts
import { Navigator } from '@multi-llm/interpretation'
import { StreamHandler } from '@multi-llm/interaction'
```

### workers (Background Jobs)

Processamento assíncrono. Opções:
- **BullMQ** (Redis-based)
- **Trigger.dev** (serverless)
- **Inngest** (event-driven)

```typescript
// apps/workers/src/jobs/process-message.ts
import { AssistantAdapter } from '@multi-llm/interpretation'
```

---

## Packages (3 Camadas)

### @multi-llm/interaction

```typescript
// Exports
export { MessageBus, type ChatEvent } from './chat/message-bus'
export { StreamHandler } from './chat/stream-handler'
export { MessageStore } from './chat/message-store'
export { Channel, ChannelManager } from './channels'
export { WebChannel } from './channels/web-channel'
```

### @multi-llm/interpretation

```typescript
// Exports
export { Navigator, type RoutingPlan } from './navigator'
export { AssistantRegistry } from './assistants/registry'
export { OllamaAdapter } from './assistants/ollama-adapter'
export { ContextBuilder } from './context'
```

### @multi-llm/maintenance

```typescript
// Exports
export { SessionManager } from './auth'
export { UserManager } from './users'
export { RoomManager } from './rooms'
export { FeatureFlags } from './config'
```

---

## Diagrama de Dependências

```
                    ┌─────────────────┐
                    │  @multi-llm/ui  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌──────────┐
        │apps/web │    │apps/api │    │apps/     │
        │(Next.js)│    │(Hono)   │    │workers   │
        └────┬────┘    └────┬────┘    └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
              ┌─────────────────────────┐
              │  @multi-llm/maintenance │
              └────────────┬────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌───────────────────┐ ┌─────────────────────────┐
│@multi-llm/        │ │@multi-llm/              │
│interaction        │ │interpretation           │
└─────────┬─────────┘ └───────────┬─────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
              ┌───────────────┐
              │@multi-llm/    │
              │types          │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │@multi-llm/db  │
              └───────────────┘
```

---

## Workplan

### Fase 0: Setup Monorepo
- [ ] Instalar Turborepo
- [ ] Configurar pnpm-workspace.yaml
- [ ] Criar estrutura de pastas
- [ ] Configurar turbo.json (pipelines)
- [ ] Mover configs compartilhadas para tooling/

### Fase 1: Extrair Packages
- [ ] Criar @multi-llm/types
- [ ] Criar @multi-llm/db (se usar DB)
- [ ] Extrair código existente para packages das 3 camadas

### Fase 2: Camada de Interação (@multi-llm/interaction)
- [ ] Criar interface `Channel` base
- [ ] Criar `channel-manager.ts`
- [ ] Criar `web-channel.ts`
- [ ] Criar `message-bus.ts`
- [ ] Criar `stream-handler.ts`

### Fase 3: Camada de Interpretação (@multi-llm/interpretation)
- [ ] Renomear "orchestrator" → "navigator"
- [ ] Criar `navigator.ts` com interface clara
- [ ] Separar `routing-rules.ts` do LLM
- [ ] Criar `ollama-adapter.ts` com streaming

### Fase 4: Camada de Manutenção (@multi-llm/maintenance)
- [ ] Extrair `room-manager.ts`
- [ ] Criar `user-manager.ts`
- [ ] Organizar auth
- [ ] Criar `feature-flags.ts`

### Fase 5: Apps
- [ ] Refatorar apps/web para usar packages
- [ ] Criar apps/api (Hono ou Fastify)
- [ ] Criar apps/workers (BullMQ ou similar)

### Fase 6: Integração
- [ ] Conectar as 3 camadas
- [ ] Testar fluxo completo com streaming
- [ ] Implementar WebSocket no apps/api

### Fase 7: Cleanup
- [ ] Remover código antigo de src/services
- [ ] Atualizar documentação
- [ ] Rodar biome check em todos packages

---

## Configuração Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check": {
      "dependsOn": ["^check"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

---

## Abstração Multi-Canal

```
                    ┌─────────────────────┐
                    │    Message Bus      │  ← Core agnóstico de canal
                    │  (eventos internos) │
                    └─────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Web Channel   │  │ WhatsApp Channel│  │ Telegram Channel│
│  (WebSocket)    │  │   (futuro)      │  │    (futuro)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
    Browser/App         WhatsApp API        Telegram Bot API
```

### Interface Channel

```typescript
interface Channel {
  readonly id: string
  readonly type: ChannelType
  
  connect(): Promise<void>
  disconnect(): Promise<void>
  onMessage(handler: (msg: IncomingMessage) => void): void
  send(msg: OutgoingMessage): Promise<void>
  
  supportsStreaming(): boolean
  sendToken?(messageId: string, token: string): Promise<void>
}

type ChannelType = 'web' | 'whatsapp' | 'telegram' | 'messenger' | 'slack'
```

---

## Interfaces Principais

### @multi-llm/interaction

```typescript
interface MessageBus {
  publish(event: ChatEvent): void
  subscribe(handler: (event: ChatEvent) => void): () => void
}

type ChatEvent =
  | { type: 'user-message'; message: Message }
  | { type: 'assistant-start'; assistantId: string; messageId: string }
  | { type: 'assistant-token'; messageId: string; token: string }
  | { type: 'assistant-end'; messageId: string }
  | { type: 'assistant-error'; messageId: string; error: string }

interface StreamHandler {
  startStream(roomId: string, assistantId: string): string
  pushToken(messageId: string, token: string): void
  endStream(messageId: string): void
}
```

### @multi-llm/interpretation

```typescript
interface Navigator {
  route(message: Message, context: ConversationContext): Promise<RoutingPlan>
}

interface RoutingPlan {
  assistants: AssistantId[]
  reasoning: string
  shouldBlock: boolean
}

interface AssistantAdapter {
  streamResponse(
    assistantId: AssistantId,
    prompt: string,
    context: Message[],
    onToken: (token: string) => void
  ): Promise<void>
}
```

### @multi-llm/maintenance

```typescript
interface FeatureFlags {
  isDebugMode(userId: string): boolean
  canSeeNavigatorDecisions(userId: string): boolean
}
```

---

## Assistentes Configurados

| ID                   | Nome              | Modelo        | Porta  |
|---------------------|-------------------|---------------|--------|
| general-assistant   | General Assistant | llama3.2      | 11434  |
| code-assistant      | Code Assistant    | codellama:7b  | 11435  |
| creative-assistant  | Creative Assistant| llama3.2      | 11436  |
| navigator           | (interno)         | llama3.2      | 11430  |
