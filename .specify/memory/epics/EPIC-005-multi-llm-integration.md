# Integração Multi-LLM — Epic Spec

**Status:** [DRAFT]  
**Sprint:** A definir (após EPIC-001)  
**Prioridade:** Alta  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07

---

## 📋 Contexto

Atualmente o sistema está **acoplado ao Ollama**:
- Assistentes hardcoded em `packages/interpretation/src/assistants/registry.ts` (3 assistentes fixos)
- `ollama-adapter.ts` faz chamadas HTTP diretas à API Ollama
- `llm-router.ts` (Navigator) também usa Ollama diretamente
- Sem suporte a OpenAI, Anthropic, Google, Mistral, etc.
- Modelos e endpoints fixos no código — sem configuração dinâmica

Isso limita o produto a uso local com Ollama e impede qualquer integração com provedores cloud.

---

## 🎯 Objetivo

Substituir o acoplamento direto ao Ollama por uma abstração multi-provider usando `multi-llm-ts`. Assistentes e provedores são configuráveis via banco de dados (SurrealDB). Ollama continua como opção, mas não é mais o único provider.

---

## 📐 Escopo

### Inclui

#### Fase 1 — Abstração de Providers (Backend)
- Instalar e configurar `multi-llm-ts`
- Criar adapter genérico substituindo `ollama-adapter.ts`
- Suporte a providers: Ollama, OpenAI, Anthropic, Google
- Streaming via `multi-llm-ts` (compatível com contrato WebSocket existente)
- Navigator provider-agnostic (usar qualquer modelo para routing)

#### Fase 2 — Registry Dinâmico (Backend + DB)
- Assistentes e providers persistidos no SurrealDB (não mais hardcoded)
- CRUD de assistentes e providers via repositories
- Seed script para migrar config atual (3 assistentes Ollama) para DB
- API keys encriptadas no banco

#### Fase 3 — API de Administração (Backend)
- Rotas REST para CRUD de assistentes e providers
- Endpoint de teste de conexão (`POST /admin/providers/:id/test`)
- Proteção por auth (somente admin)

#### Fase 4 — Admin UI (Frontend) — prioridade baixa
- Interface para gerenciar assistentes e providers
- Configuração de API keys
- Teste de conexão via UI

### Não inclui
- Suporte a providers não cobertos pelo `multi-llm-ts`
- Gerenciamento de custos/billing por provider
- Rate limiting por provider (feature futura)
- Load balancing entre providers
- Fine-tuning ou training de modelos

---

## 🏗️ Decisões Técnicas

| Decisão | Justificativa |
|---------|---------------|
| `multi-llm-ts` (v5.x) | TypeScript nativo, streaming support, API unificada, suporta Ollama + OpenAI + Anthropic + Google + Mistral + Groq |
| SurrealDB para persistência | Consistente com EPIC-001; assistentes e providers como documentos |
| Adapter pattern | Interface única, implementações por provider; fácil adicionar novos |
| API keys encriptadas | Segurança — nunca armazenar keys em plain text |
| Ollama como default | Mantém funcionamento local sem API keys; zero custo para dev |
| Admin UI posposta | Fases 1-3 configuráveis via seed/DB direto; UI quando o backend estiver estável |

---

## 🗂️ Estrutura de Dados

### Provider (novo)

```typescript
interface Provider {
  id: string
  type: 'ollama' | 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq'
  name: string
  apiKey?: string           // Encriptada
  endpoint?: string         // Para Ollama/custom endpoints
  config?: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Assistant (estendido)

```typescript
interface Assistant {
  id: string
  name: string
  description: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'busy'

  // Multi-LLM config
  providerId: string        // FK → Provider
  model: string             // "gpt-4o", "claude-3.5-sonnet", "llama3.2"
  temperature?: number
  maxTokens?: number
  systemPrompt?: string

  createdAt: Date
  updatedAt: Date
}
```

---

## 🏛️ Arquitetura Alvo

```
packages/interpretation/
├── assistants/
│   ├── registry.ts              # Dynamic registry (DB-backed)
│   ├── multi-llm-adapter.ts     # Substitui ollama-adapter.ts (usa multi-llm-ts)
│   └── types.ts                 # Provider configs
├── providers/                   # NOVO
│   ├── provider-manager.ts      # Gerencia instâncias de providers
│   └── provider-factory.ts      # Cria providers via multi-llm-ts
├── navigator/
│   ├── navigator.ts
│   ├── llm-router.ts            # Provider-agnostic (não mais Ollama direto)
│   └── routing-rules.ts
└── context/
    └── context-builder.ts

apps/api/src/
├── repositories/
│   ├── provider.repository.ts   # NOVO
│   └── assistant.repository.ts  # Estendido (provider FK)
└── routes/
    └── admin/                   # NOVO (Fase 3)
        ├── assistants.ts
        └── providers.ts
```

---

## 🔗 Tasks Vinculadas

> Tasks serão criadas quando este épico entrar em sprint.

### Fase 1 — Abstração de Providers
- [ ] Instalar `multi-llm-ts` em `packages/interpretation`
- [ ] Criar `providers/provider-factory.ts` — factory para instanciar providers via `multi-llm-ts`
- [ ] Criar `providers/provider-manager.ts` — cache de instâncias ativas
- [ ] Criar `assistants/multi-llm-adapter.ts` — substitui `ollama-adapter.ts`
- [ ] Refatorar `navigator/llm-router.ts` — usar adapter genérico em vez de Ollama direto
- [ ] Manter Ollama como provider default (env vars existentes continuam funcionando)

### Fase 2 — Registry Dinâmico
- [ ] Criar tabela `provider` no schema SurrealQL
- [ ] Estender tabela `assistant` com campos de provider
- [ ] Criar `provider.repository.ts`
- [ ] Refatorar `registry.ts` — buscar do DB em vez de hardcoded Map
- [ ] Criar seed script (migrar 3 assistentes Ollama + 1 provider Ollama para DB)
- [ ] Implementar encriptação de API keys

### Fase 3 — API de Administração
- [ ] `GET /admin/providers` — listar providers
- [ ] `POST /admin/providers` — criar provider
- [ ] `PUT /admin/providers/:id` — editar provider
- [ ] `POST /admin/providers/:id/test` — testar conexão
- [ ] `GET /admin/assistants` — listar assistentes
- [ ] `POST /admin/assistants` — criar assistente
- [ ] `PUT /admin/assistants/:id` — editar assistente
- [ ] `DELETE /admin/assistants/:id` — remover assistente
- [ ] Middleware de auth admin

### Fase 4 — Admin UI (baixa prioridade)
- [ ] Layout admin (`apps/web/src/app/admin/layout.tsx`)
- [ ] Página de providers (lista, create, edit)
- [ ] Página de assistentes (lista, create, edit)
- [ ] Teste de conexão via UI
- [ ] Input de API key com masking

---

## 🤝 Contratos

- **REST API (novo):** `.github/contracts/api/admin-api.md` — CRUD de assistentes e providers
- **Package (atualizar):** `.github/contracts/packages/interpretation.md` — nova interface de providers
- **WebSocket (sem mudança):** eventos `message:streaming` e `message:complete` permanecem iguais

---

## 📦 Dependências

### Depende de
- **EPIC-001** (Persistência SurrealDB) — providers e assistentes precisam de DB
- **EPIC-002** (Separação API) — rotas admin vivem em `apps/api`

### Bloqueia
- Suporte a provedores cloud (OpenAI, Claude, etc.)
- Configuração dinâmica de assistentes (sem redeploy)
- Admin UI funcional

### Dependências externas
- [`multi-llm-ts`](https://www.npmjs.com/package/multi-llm-ts) v5.x

---

## ✅ Critérios de Aceite (Nível Épico)

### Fase 1
- [ ] `ollama-adapter.ts` removido; substituído por `multi-llm-adapter.ts`
- [ ] Provider Ollama funciona identicamente ao comportamento atual
- [ ] Navigator usa adapter genérico (não Ollama direto)
- [ ] Streaming funciona via `multi-llm-ts` (mesmos eventos WebSocket)
- [ ] Testes com pelo menos 1 provider adicional (OpenAI ou Anthropic) se houver API key disponível

### Fase 2
- [ ] Assistentes e providers vivem no SurrealDB
- [ ] Seed script popula DB com config Ollama atual
- [ ] Registry busca do banco, não de Map hardcoded
- [ ] API keys encriptadas no banco
- [ ] Sistema funciona com banco populado (sem hardcode)

### Fase 3
- [ ] CRUD funcional via REST API
- [ ] Teste de conexão retorna status do provider
- [ ] Rotas protegidas por auth
- [ ] `pnpm typecheck` passa sem erros

### Fase 4
- [ ] Admin UI funcional para gerenciar assistentes e providers
- [ ] API keys mascaradas na UI
- [ ] Teste de conexão via botão na UI

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| `multi-llm-ts` pode ter breaking changes ou ser abandonada | Alto | Adapter pattern isola a dependência; substituível sem mudar o resto |
| API keys expostas no banco | Alto | Encriptar com chave de ambiente; nunca retornar key completa na API |
| Custos de APIs pagas (OpenAI, Anthropic) | Médio | Ollama como default; warnings na config; limite de tokens configurável |
| Performance variável entre providers | Médio | Timeout configurável por provider; fallback para Ollama se provider lento |
| Conflito de tipos entre `@multi-llm/types` e `multi-llm-ts` | Baixo | Adapter traduz tipos; interface interna não muda |

---

## 📝 Notas

- O plano original está em `.github/plans/2026-04-03-multi-llm-integration.md`
- O plano mencionava Drizzle ORM — decisão atualizada para SurrealDB (consistente com EPIC-001)
- Tipo `Assistant` em `packages/types/src/db/assistant.ts` já tem campo `provider` — alinhar com esta spec
- Containers Ollama atuais (4x Docker) continuam funcionando sem mudança
- Fase 4 (Admin UI) é de prioridade baixa — pode ser um EPIC separado se necessário
