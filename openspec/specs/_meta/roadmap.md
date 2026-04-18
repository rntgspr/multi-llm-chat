# Roadmap — Iniciativas Estratégicas

**Atualizado:** 2026-04-21

Este documento consolida as grandes iniciativas planejadas para o projeto Synergy. Cada iniciativa pode ser dividida em uma ou mais changes quando priorizada.

---

## 🚀 Iniciativas Planejadas

### 1. Multi-LLM Integration (Alta Prioridade)

**Objetivo:** Substituir acoplamento direto ao Ollama por abstração multi-provider usando `vercel/ai`.

**Contexto:**  
Atualmente o sistema está acoplado ao Ollama com assistentes hardcoded. Não há suporte a OpenAI, Anthropic, Google, Mistral, etc. Isso limita o produto a uso local.

**Escopo:**
- Abstração de providers usando `vercel/ai`
- Suporte a múltiplos providers (Ollama, OpenAI, Anthropic, Google)
- Assistentes e providers configuráveis via SurrealDB (não hardcoded)
- API de administração para CRUD de assistentes e providers
- UI de gerenciamento de modelos e providers

**Dependências:** Nenhuma (pode iniciar agora)

**Referência:** `openspec/specs/_reference/epics/EPIC-005-multi-llm-integration.md` (será removido)

---

### 2. Streaming Token-por-Token (Alta Prioridade)

**Objetivo:** Implementar streaming real token-por-token estilo ChatGPT para respostas dos assistentes.

**Contexto:**  
O `StreamHandler` existe mas não está conectado end-to-end. Respostas chegam como bloco completo, sem feedback incremental.

**Escopo:**
- Implementar `streamResponse()` no adapter de LLM
- Conectar `StreamHandler` ↔ Adapter ↔ `MessageBus`
- Emitir eventos `message:streaming` via WebSocket a cada token
- Componente de chat renderiza tokens incrementalmente
- Suporte a cancel/abort de streams (opcional)

**Dependências:** Idealmente após Multi-LLM Integration (para streaming genérico)

**Referência:** `openspec/specs/_reference/epics/EPIC-006-streaming-token.md` (será removido)

---

### 3. Navegador Invisível (Média Prioridade)

**Objetivo:** Ocultar decisões do Navigator do chat, exibindo apenas em modo debug.

**Contexto:**  
O Navigator decide qual assistente responde, mas essas decisões aparecem no chat poluindo a conversa. Devem ser invisíveis por padrão.

**Escopo:**
- Mensagens do Navigator com `visibility: "hidden"` por padrão
- Feature flag `debug.showNavigatorDecisions`
- UI condicional baseada na flag
- Modo sequencial: bloquear input do usuário durante navegação
- Estilo visual diferenciado para mensagens de debug

**Dependências:** Nenhuma (pode iniciar agora)

**Referência:** `openspec/specs/_reference/epics/EPIC-007-navegador-invisivel.md` (será removido)

---

### 4. Workers & Background Jobs (Baixa Prioridade)

**Objetivo:** Implementar sistema de background jobs para tarefas assíncronas.

**Contexto:**  
Algumas operações (exports, analytics, cleanup) devem rodar em background sem bloquear o fluxo principal.

**Escopo:**
- Implementar `apps/workers` com BullMQ + Redis
- Jobs para: export de conversas, cleanup de sessões expiradas, agregação de métricas
- Dashboard de monitoramento de jobs (opcional)

**Dependências:** Nenhuma (pode iniciar agora)

**Referência:** `openspec/specs/_reference/epics/EPIC-004-workers-background.md` (será removido)

---

## 📋 Próximos Passos

Quando priorizar uma iniciativa:

1. Use `/opsx:explore` para investigar e clarificar requisitos
2. Use `/opsx:propose` para criar a change com design completo
3. Delegue ao Developer para `/opsx:apply` e implementação
4. Use `/opsx:archive` após conclusão

---

## 📚 Histórico de Iniciativas Concluídas

Ver: `openspec/changes/archive/`

- ✅ **001-persistencia-surrealdb** — Persistência com SurrealDB
- ✅ **002-separacao-api** — Separação da API (apps/api)
- ✅ **003-redis-session-pubsub** — Redis Session Store e Pub/Sub
- ✅ **004-rename-to-synergy** — Rename do projeto para Synergy
