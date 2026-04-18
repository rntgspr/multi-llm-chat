# Plano de Implementação: Separação do WebSocket/API (EPIC-002)

**Branch**: `002-separacao-api` | **Data**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Entrada**: Especificação da feature em `.specify/specs/002-separacao-api/spec.md`

**Nota**: Este plano foi gerado pelo comando `/speckit.plan`.

## Resumo

Este épico separa o servidor WebSocket e rotas de API da aplicação Next.js (apps/web) para um serviço Hono standalone (apps/api). Os objetivos principais são:

1. **Mover servidor WebSocket** from apps/web/server.ts to apps/api rodando na porta 4000
2. **Migrar rotas de API** de endpoints REST para Next.js Server Actions em apps/web
3. **Habilitar comunicação** entre Server Actions e WebSocket via Redis Pub/Sub (EPIC-003)
4. **Implementar autenticação JWT** para conexões WebSocket usando NEXTAUTH_SECRET
5. **Remover código legado** - eliminar servidor Next.js customizado e rotas de API REST

**Abordagem Técnica**: Usar Redis Pub/Sub (já implementado em EPIC-003) para conectar Server Actions em apps/web com broadcasts WebSocket em apps/api. Server Actions salvam dados no SurrealDB e publicam eventos no Redis; apps/api subscreve canais Redis e faz broadcast para clientes WebSocket. Tokens JWT do NextAuth validam conexões WebSocket. Degradação graciosa com atualizações otimistas tratam cenários offline.

## Contexto Técnico

### Stack
- **TypeScript** 5.x
- **Node.js** 20.x
- **Next.js** 16.2.2 with React 19.2.4
- **Hono** 4.12.9 (framework HTTP leve para apps/api)
- **Socket.io** 4.8.3 (servidor WebSocket)
- **NextAuth** 5.0.0-beta.30 (autenticação)
- **SurrealDB** 2.0.3 (armazenamento frio para dados persistentes)
- **Redis** 7.x (armazenamento quente para conversas ativas, sessões, cache, pub/sub)
- **ioredis** 5.4.1 (cliente Redis)

### Dependências Principais
- `@multi-llm/platform` - Infraestrutura compartilhada (cliente Rediss, adaptadores de autenticação, cache, pub/sub, logging)
- `@multi-llm/db` - repositórios SurrealDB para armazenamento persistente
- `@multi-llm/types` - Tipos TypeScript compartilhados
- `@multi-llm/interaction` - Lógica de negócio para interações de chat
- `@multi-llm/interpretation` - Processamento de respostas LLM

### Princípios de Arquitetura
- **Redis-first para chat**: Conversas ativas armazenadas no Redis (hot storage), sincronizadas ao SurrealDB de forma assíncrona
- **apps/api**: APENAS acessa Redis (zero acesso direto ao DB) - gerencia camada real-time WebSocket
- **apps/web**: Server Actions acessam SurrealDB para dados persistentes + Redis para dados quentes
- **apps/workers**: Sincronização em background Redis → SurrealDB + jobs de limpeza
- **Separação de responsabilidades**: Tempo real (apps/api) desacoplado da persistência (apps/web + workers)

**Language/Version**: TypeScript 5.x / Node.js 20.x
**Primary Dependencies**: 
- apps/web: Next.js 16.2.2, React 19.2.4, NextAuth 5.0.0-beta.30, Socket.io-client 4.8.3
- apps/api: Hono 4.12.9, Socket.io 4.8.3, @hono/node-server 1.19.12
- Shared: @multi-llm/db (SurrealDB 2.0.3), @multi-llm/platform (ioredis 5.4.1 for Redis Pub/Sub)

**Armazenamento**: 
- **Redis** (armazenamento quente): Conversas ativas, mensagens recentes (últimas N por sala), presença, indicadores de digitação
- **SurrealDB** (armazenamento frio): Histórico completo de chat, dados de usuário, metadados de sala, registros persistentes
- **Estratégia de sincronização**: jobs em background de apps/workers sincronizam Redis → SurrealDB de forma assíncrona

**Testes**: Jest/Vitest (padrão para monorepo), testes de integração para Server Actions e WebSocket
**Plataforma Alvo**: Servidor Node.js (desenvolvimento: macOS/Linux, produção: containers)
**Tipo de Projeto**: Aplicação web full-stack (frontend Next.js + serviço API Hono + servidor WebSocket)

**Metas de Performance**:
- Entrega de mensagem WebSocket: <1s latência (p99)
- Server Actions: <3s para operações CRUD
- Handshake WebSocket: <50ms latência adicional para validação JWT
- Health check: <100ms tempo de resposta (p99)
- Conexões WebSocket concorrentes: 1000+ sem degradação

**Restrições**:
- Deve manter retrocompatibilidade durante migração
- Requisito de deploy sem downtime (shutdown gracioso)
- Toda autenticação deve usar infraestrutura NextAuth existente
- Redis Pub/Sub deve lidar com falhas graciosamente (echo local + consistência eventual)
- IDs de correlação necessários para rastreamento fim-a-fim através de Server Actions → Redis → WebSocket

**Escala/Escopo**:
- 2 aplicações: apps/web (Next.js), apps/api (Hono + WebSocket)
- 5 packages compartilhados: @multi-llm/db, @multi-llm/interaction, @multi-llm/interpretation, @multi-llm/platform, @multi-llm/types
- Escopo da migração: ~10 rotas de API → Server Actions, 1 servidor customizado → apps/api
- Namespaces WebSocket: /chat, /presence, /typing (a serem definidos na fase de pesquisa)

## Verificação da Constitution

*GATE: Deve passar antes da pesquisa da Fase 0. Re-verificar após design da Fase 1.*

### Governance: Git Actions and Branches ✅

**Rule**: NÃO criar NENHUMA branch ou executar QUALQUER ação usando git sem coordenação prévia com o time de liderança.

**Status**: ✅ APROVADO - Branch `002-separacao-api` foi criada com coordenação do usuário como parte do fluxo de planejamento.

**Verificação Pré-Fase 0**: Nenhuma violação detectada. Constitution parece estar em estado draft com seções placeholder além da governança Git. Prosseguindo para fase de pesquisa. ✅

**Verificação Pós-Fase 1**: ✅ APROVADO

Após completar o design da Fase 1 (pesquisa, modelo de dados, contratos, quickstart), nenhuma violação adicional da constitution foi introduzida. O design:

- ✅ Usa infraestrutura existente (Redis Pub/Sub do EPIC-003, SurrealDB do EPIC-001)
- ✅ Segue melhores práticas Next.js (Server Actions ao invés de rotas de API customizadas)
- ✅ Separa responsabilidades de forma limpa (apps/web para frontend, apps/api para WebSocket)
- ✅ Mantém segurança com validação JWT
- ✅ Documenta todas as APIs em contratos

Nenhum novo padrão ou complexidade que viole os princípios declarados. Pronto para prosseguir para implementação (Fase 2 - geração de tarefas via `/speckit.tasks`).

## Estrutura do Projeto

### Documentação (desta feature)

```text
specs/002-separacao-api/
├── plan.md              # Este arquivo (saída do comando /speckit.plan)
├── spec.md              # Especificação da feature (entrada)
├── research.md          # Saída da Fase 0 (comando /speckit.plan)
├── data-model.md        # Saída da Fase 1 (comando /speckit.plan)
├── quickstart.md        # Saída da Fase 1 (comando /speckit.plan)
├── contracts/           # Saída da Fase 1 (comando /speckit.plan)
│   ├── websocket-api.md       # Eventos WebSocket, namespaces, autenticação
│   ├── server-actions-api.md  # Assinaturas de Server Actions e tipos de erro
│   └── redis-events.md        # Schemas de canais Redis Pub/Sub
└── tasks.md             # Saída da Fase 2 (comando /speckit.tasks - NÃO criado por /speckit.plan)
```

### Código Fonte (raiz do repositório)

```text
apps/
├── web/                        # Next.js application (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (authenticated)/  # Protected routes
│   │   │   ├── auth/             # NextAuth pages
│   │   │   └── api/              # [TO BE REMOVED] Legacy API routes
│   │   ├── components/           # React components
│   │   ├── hooks/
│   │   │   └── use-websocket.ts  # [TO BE UPDATED] WebSocket client
│   │   ├── lib/
│   │   │   └── actions/          # [TO BE CREATED] Server Actions
│   │   │       ├── rooms.ts      # Room CRUD actions
│   │   │       ├── messages.ts   # Message actions + Redis publish
│   │   │       ├── assistants.ts # Assistant management
│   │   │       └── invites.ts    # Invite management
│   │   └── services/
│   │       └── websocket/        # [TO BE MOVED TO apps/api]
│   ├── server.ts                 # [TO BE REMOVED] Custom Next.js server
│   └── package.json
│
├── api/                         # Hono + WebSocket service (port 4000)
│   ├── src/
│   │   ├── index.ts             # Hono app + server initialization
│   │   ├── lib/
│   │   │   ├── db.ts            # SurrealDB connection
│   │   │   ├── redis-init.ts    # Redis Pub/Sub initialization
│   │   │   └── correlation-id.ts # [TO BE CREATED] Correlation ID middleware
│   │   ├── middlewares/         # [TO BE CREATED]
│   │   │   ├── auth.ts          # JWT validation middleware
│   │   │   └── logging.ts       # Structured logging middleware
│   │   ├── websocket/           # [TO BE MIGRATED FROM apps/web]
│   │   │   ├── server.ts        # Socket.io initialization
│   │   │   ├── namespaces/      # [TO BE CREATED]
│   │   │   │   ├── chat.ts      # /chat namespace handlers
│   │   │   │   ├── presence.ts  # /presence namespace handlers
│   │   │   │   └── typing.ts    # /typing namespace handlers
│   │   │   └── middleware/      # [TO BE CREATED]
│   │   │       └── session.ts   # Session validation for WebSocket
│   │   ├── repositories/        # [EXISTING] Database access layer
│   │   │   ├── room.repository.ts
│   │   │   ├── message.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── assistant.repository.ts
│   │   │   └── invite.repository.ts
│   │   └── subscribers/         # [TO BE UPDATED]
│   │       └── event-subscriber.ts  # Redis → WebSocket bridge
│   └── package.json
│
└── workers/                     # Background job processors
    └── ...

packages/
├── db/                          # [EXISTING] SurrealDB repository layer
│   └── src/
│       ├── repositories/        # Shared DB access
│       └── schema.surql
├── maintenance/                 # [EXISTING] Auth, Redis, Pub/Sub
│   └── src/
│       ├── auth/               # NextAuth integration
│       ├── cache/              # Redis cache operations
│       ├── pubsub/             # Redis Pub/Sub (publisher + subscriber)
│       ├── rooms/              # Room manager
│       └── users/              # User manager
├── interaction/                # [EXISTING] LLM interaction logic
├── interpretation/             # [EXISTING] Message interpretation
└── types/                      # [EXISTING] Tipos TypeScript compartilhados
```

**Decisão de Estrutura**: 

Este é um **monorepo de aplicação web** com frontend separado (Next.js) e serviço de API (Hono + WebSocket). A estrutura segue a arquitetura existente dos EPIC-001 e EPIC-003:

- **apps/web**: Frontend Next.js com Server Actions para lógica backend (sem servidor customizado após migração)
- **apps/api**: Serviço Hono standalone hospedando servidor WebSocket e subscribers Redis Pub/Sub
- **packages**: Lógica de negócio compartilhada, acesso a banco de dados e infraestrutura

Principais mudanças neste épico:
1. Remover `apps/web/server.ts` e todas as rotas `apps/web/src/app/api/*`
2. Mover lógica WebSocket de `apps/web/src/services/websocket` para `apps/api/src/websocket`
3. Criar Server Actions em `apps/web/src/lib/actions/*` para substituir rotas de API
4. Atualizar `apps/api/src/subscribers/event-subscriber.ts` para fazer ponte Redis → WebSocket

## Rastreamento de Complexidade

> **Verificação da Constitution: Sem violações para justificar**

Este épico não introduz novos padrões arquiteturais ou complexidade que viole os princípios da constitution. É um esforço de **refatoração e separação** que:

- Usa infraestrutura Redis Pub/Sub existente (EPIC-003)
- Usa persistência SurrealDB existente (EPIC-001)
- Segue melhores práticas Next.js (Server Actions ao invés de rotas de API)
- Separa responsabilidades (WebSocket em serviço dedicado)
- Reduz complexidade ao remover servidor Next.js customizado

Nenhuma justificativa adicional necessária.
