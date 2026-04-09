# Status Atual do Projeto

**Data:** 2026-04-07  
**Progresso:** ~70% completo

---

## ✅ O que está FUNCIONANDO

### Monorepo
- ✅ Turborepo configurado e rodando
- ✅ pnpm workspace com apps/ + packages/
- ✅ Builds paralelos funcionando

### Packages (3 Camadas)
- ✅ **@multi-llm/types** — Tipos compartilhados entre todos os packages
- ✅ **@multi-llm/interaction** — MessageBus, MessageStore, StreamHandler, Channel abstractions
- ✅ **@multi-llm/interpretation** — Navigator, LLM Router, Ollama Adapter, Context Builder
- ✅ **@multi-llm/maintenance** — RoomManager, UserManager, Session, FeatureFlags

### Apps
- ✅ **apps/web** — Next.js rodando, integrando com packages
- ✅ **apps/api** — Estrutura básica criada (Hono)
- ✅ **apps/workers** — Placeholder criado

### Docker
- ✅ `docker-compose.yml` — Infra (SurrealDB + Redis) com health checks e volumes persistentes
- ✅ `docker-compose.llm.yml` — 4 containers Ollama com lifecycle independente:
  - ollama-orchestrator (porta 11430)
  - ollama-general (porta 11434)
  - ollama-code (porta 11435)
  - ollama-creative (porta 11436)
- ✅ Rede `multi-llm-network` compartilhada entre composes

---

## 🔄 O que está EM ANDAMENTO

### Integração apps/web ↔ packages
- 🔄 API routes usando packages (@multi-llm/interpretation, @multi-llm/maintenance)
- 🔄 Código legado em `apps/web/src/services` ainda existe (duplicado)
- 🔄 Migração gradual dos services para packages

### Streaming
- 🔄 Estrutura de streaming existe, mas não está completo token-por-token
- 🔄 StreamHandler implementado, mas não integrado end-to-end

### WebSocket
- 🔄 Código de WebSocket ainda está em apps/web
- 🔄 Precisa ser movido para apps/api

---

## ❌ O que está FALTANDO

### Fase de Integração Final
- ❌ Remover serviços legados duplicados de `apps/web/src/services`
- ❌ Implementar streaming token-por-token real (como ChatGPT)
- ❌ Mover WebSocket para apps/api
- ❌ Conectar MessageBus completamente entre camadas
- ❌ Implementar web-channel.ts (abstração de canal web)

### Apps Secundários
- ❌ apps/api — Rotas REST não implementadas ainda
- ❌ apps/workers — Jobs de background não implementados

### Features Pendentes
- ❌ Navegador invisível (decisões não aparecem no chat, exceto debug mode)
- ❌ Modo sequencial (bloquear input do usuário enquanto navega)
- 🔄 Database — SurrealDB no Docker Compose; repositories e migração dos managers pendentes (EPIC-001)
- ❌ UI para gerenciar modelos/assistentes

### Testes & Qualidade
- ❌ Testes unitários
- ❌ Testes E2E
- ❌ CI/CD

---

## 📊 Estrutura Atual

```
multi-llm-chat/
├── apps/
│   ├── web/                       ✅ Next.js funcionando
│   │   ├── src/
│   │   │   ├── app/               ✅ API routes usando packages
│   │   │   ├── components/        ✅ UI components
│   │   │   ├── services/          🔄 LEGADO - precisa migrar
│   │   │   └── types/             ✅ Re-exporta @multi-llm/types
│   ├── api/                       🔄 Estrutura criada
│   │   └── src/index.ts           ❌ Rotas não implementadas
│   └── workers/                   🔄 Placeholder
│       └── src/index.ts           ❌ Jobs não implementados
│
├── packages/
│   ├── types/                     ✅ COMPLETO
│   ├── interaction/               ✅ COMPLETO
│   │   ├── chat/
│   │   │   ├── message-bus.ts     ✅ Implementado
│   │   │   ├── message-store.ts   ✅ Implementado
│   │   │   └── stream-handler.ts  ✅ Implementado
│   │   └── channels/
│   │       ├── channel.ts         ✅ Interface base
│   │       └── channel-manager.ts ✅ Implementado
│   ├── interpretation/            ✅ COMPLETO
│   │   ├── navigator/
│   │   │   ├── navigator.ts       ✅ Implementado
│   │   │   ├── llm-router.ts      ✅ Implementado
│   │   │   └── routing-rules.ts   ✅ Implementado
│   │   ├── assistants/
│   │   │   ├── registry.ts        ✅ Implementado
│   │   │   └── ollama-adapter.ts  ✅ Implementado
│   │   └── context/
│   │       └── context-builder.ts ✅ Implementado
│   └── maintenance/               ✅ COMPLETO
│       ├── rooms/
│       │   └── room-manager.ts    ✅ Implementado
│       ├── users/
│       │   └── user-manager.ts    ✅ Implementado
│       ├── auth/
│       │   └── session.ts         ✅ Implementado
│       └── config/
│           └── feature-flags.ts   ✅ Implementado
│
└── tooling/                       ✅ Configs compartilhadas
    ├── biome/
    └── typescript/
```

---

## 🎯 Próximos Passos (Prioridade)

### 1. Cleanup de Código Legado (apps/web)
- [ ] Mapear o que ainda está em `apps/web/src/services`
- [ ] Verificar se está duplicado nos packages
- [ ] Remover duplicações
- [ ] Atualizar imports

### 2. Streaming Token-por-Token Real
- [ ] Implementar em ollama-adapter.ts
- [ ] Conectar com StreamHandler
- [ ] Testar fluxo end-to-end

### 3. Mover WebSocket para apps/api
- [ ] Extrair lógica de WebSocket de apps/web
- [ ] Implementar em apps/api
- [ ] Atualizar cliente no frontend

### 4. Navegador Invisível
- [ ] Implementar modo debug no FeatureFlags
- [ ] Ocultar decisões do navegador por padrão
- [ ] Mostrar apenas quando debug=true

### 5. Modo Sequencial
- [ ] Implementar bloqueio de input durante navegação
- [ ] Adicionar estado "thinking" visível
- [ ] Permitir múltiplas chamadas em sequência

---

## 🐛 Issues Conhecidos

1. **Duplicação de código** — `apps/web/src/services` vs packages
2. **Streaming incompleto** — Não está token-por-token ainda
3. **WebSocket no lugar errado** — Deveria estar em apps/api
4. **web-channel.ts não implementado** — Abstração de canal web faltando
5. **Navegador visível** — Decisões aparecem no chat (não deveria)

---

## 📚 Documentação Relacionada

- [Plano de Implementação](./plano-implementacao.md)
- [Arquitetura 3 Camadas](./arquitetura-3-camadas.md)
- [Guia Docker Ollama](./assistentes-docker.md)
- [EPIC-001 — Persistência SurrealDB](./epics/EPIC-001-persistencia-surrealdb.md)
