# Plano de Implementação: Multi-LLM-TS Integration

**Data:** 2026-04-03  
**Status:** DRAFT  
**Objetivo:** Integrar multi-llm-ts para suportar múltiplos provedores de LLM (OpenAI, Anthropic, Google, Ollama, etc.) com interface de administração

---

## 📊 Estado Atual

### Modelos LLM em Uso

#### Docker Containers (Ollama)
1. **ollama-orchestrator** (porta 11430)
   - Modelo: `llama3.2`
   - Função: Navigator/Router (decide qual assistente responde)

2. **ollama-general** (porta 11434)
   - Modelo: `llama3.2`
   - Função: General Assistant (propósito geral)

3. **ollama-code** (porta 11435)
   - Modelo: `codellama:7b`
   - Função: Code Assistant (programação)

4. **ollama-creative** (porta 11436)
   - Modelo: `llama3.2`
   - Função: Creative Assistant (escrita criativa)

### Arquitetura Atual

```
packages/interpretation/
├── assistants/
│   ├── registry.ts          # Assistentes hardcoded
│   └── ollama-adapter.ts    # Cliente específico Ollama
├── navigator/
│   ├── navigator.ts
│   ├── llm-router.ts        # Usa Ollama para routing
│   └── routing-rules.ts
└── context/
    └── context-builder.ts
```

**Problemas atuais:**
- ❌ Acoplado ao Ollama
- ❌ Modelos hardcoded no código
- ❌ Sem suporte a outros provedores (OpenAI, Claude, etc.)
- ❌ Sem interface de administração

---

## 🎯 Objetivo Final

### Arquitetura Desejada

```
packages/interpretation/
├── assistants/
│   ├── registry.ts          # Dynamic registry (DB-backed)
│   ├── multi-llm-adapter.ts # Usa multi-llm-ts
│   └── types.ts             # Provider configs
├── navigator/
│   ├── navigator.ts
│   ├── llm-router.ts        # Provider-agnostic
│   └── routing-rules.ts
└── context/
    └── context-builder.ts

packages/db/                  # NOVO
├── schema.ts                # Schema para assistentes e provedores
└── client.ts

apps/web/src/app/
└── admin/                   # NOVO
    ├── assistants/
    │   ├── page.tsx         # Lista assistentes
    │   ├── [id]/
    │   │   └── edit/
    │   │       └── page.tsx # Editar config
    │   └── new/
    │       └── page.tsx     # Criar novo
    └── providers/
        └── page.tsx         # Configurar API keys
```

**Recursos:**
- ✅ Suporte a múltiplos provedores (OpenAI, Anthropic, Google, Ollama, etc.)
- ✅ Modelos configuráveis dinamicamente
- ✅ Interface de administração
- ✅ Persistência em banco de dados
- ✅ Fallback automático
- ✅ Compatibilidade com Ollama existente

---

## 📋 Decisões Arquiteturais

### 1. Biblioteca Base
**Escolha:** `multi-llm-ts` (v5.1.0)
- Suporta: OpenAI, Anthropic, Google, Ollama, Mistral, Groq, etc.
- TypeScript nativo
- Streaming support
- Unified API

### 2. Persistência
**Escolha:** Criar package `@multi-llm/db`
- Drizzle ORM (já usado no projeto)
- SQLite para desenvolvimento
- PostgreSQL para produção

### 3. UI Admin
**Escolha:** Interface Next.js em `apps/web/src/app/admin`
- Protegida por autenticação
- CRUD de assistentes
- Configuração de provedores (API keys)
- Teste de conexão

### 4. Migração
**Estratégia:** Refatoração completa
- Substituir `ollama-adapter.ts` por `multi-llm-adapter.ts`
- Migrar assistentes hardcoded para DB
- Manter Docker Ollama como opção (não default)

---

## 🗂️ Estrutura de Dados

### Schema de Banco de Dados

```typescript
// Provider Config
interface ProviderConfig {
  id: string
  type: 'openai' | 'anthropic' | 'google' | 'ollama' | 'mistral' | 'groq'
  name: string
  apiKey?: string           // Encrypted
  endpoint?: string         // Para Ollama custom
  config?: Record<string, unknown>  // Provider-specific
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Assistant Config (extended)
interface AssistantConfig {
  id: string
  name: string
  description: string
  avatarUrl?: string
  status: 'online' | 'offline'
  
  // Multi-LLM config
  providerId: string        // FK to Provider
  model: string             // e.g., "gpt-4", "claude-3", "llama3.2"
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  
  createdAt: Date
  updatedAt: Date
}
```

---

## 📝 Workplan

### Fase 1: Setup e Dependências
- [ ] Instalar multi-llm-ts
- [ ] Criar package @multi-llm/db
- [ ] Configurar Drizzle ORM
- [ ] Criar migrations iniciais

### Fase 2: Backend - Abstração de Providers
- [ ] Criar `packages/interpretation/src/providers/`
  - [ ] `provider-manager.ts` - Gerencia provedores
  - [ ] `multi-llm-adapter.ts` - Substitui ollama-adapter
  - [ ] `types.ts` - Provider types
- [ ] Atualizar `registry.ts` para buscar do DB
- [ ] Criar API routes para CRUD de assistentes
  - [ ] `GET /api/admin/assistants`
  - [ ] `POST /api/admin/assistants`
  - [ ] `PUT /api/admin/assistants/:id`
  - [ ] `DELETE /api/admin/assistants/:id`
- [ ] Criar API routes para providers
  - [ ] `GET /api/admin/providers`
  - [ ] `POST /api/admin/providers`
  - [ ] `PUT /api/admin/providers/:id`
  - [ ] `POST /api/admin/providers/:id/test` - Teste de conexão

### Fase 3: Backend - Navigator
- [ ] Refatorar `llm-router.ts` para usar multi-llm-ts
- [ ] Permitir configurar qual modelo usar para routing
- [ ] Manter compatibilidade com regras existentes

### Fase 4: Frontend - UI Admin
- [ ] Criar layout `apps/web/src/app/admin/layout.tsx`
- [ ] Página de listagem de assistentes
  - [ ] Tabela com status, provider, modelo
  - [ ] Botões editar/deletar
  - [ ] Botão criar novo
- [ ] Página de criação de assistente
  - [ ] Form com todos os campos
  - [ ] Seleção de provider
  - [ ] Seleção de modelo (filtrado por provider)
  - [ ] Preview de system prompt
- [ ] Página de edição de assistente
  - [ ] Same as criação
  - [ ] Botão testar conexão
- [ ] Página de configuração de providers
  - [ ] Lista de provedores configurados
  - [ ] Form para adicionar novo
  - [ ] Input de API key (encrypted)
  - [ ] Botão testar conexão

### Fase 5: Migração e Dados Iniciais
- [ ] Criar seed script
  - [ ] Migrar assistentes atuais para DB
  - [ ] Criar provider "Ollama Local"
  - [ ] Associar assistentes ao provider Ollama
- [ ] Script de migração para produção
- [ ] Documentar processo de setup

### Fase 6: Testes e Validação
- [ ] Testar cada provider:
  - [ ] Ollama (compatibilidade)
  - [ ] OpenAI (se tiver API key)
  - [ ] Anthropic (se tiver API key)
- [ ] Testar criação/edição de assistentes via UI
- [ ] Testar fallback quando provider offline
- [ ] Testar navigator com diferentes providers

### Fase 7: Documentação
- [ ] Atualizar `.github/memory/assistentes-docker.md`
- [ ] Criar `.github/memory/multi-llm-setup.md`
- [ ] Documentar como adicionar novos providers
- [ ] Documentar como migrar de Ollama para outro provider

### Fase 8: Cleanup
- [ ] Remover código legado de ollama-adapter
- [ ] Atualizar docker-compose.yml (opcional)
- [ ] Remover dependências não utilizadas
- [ ] Rodar biome check

---

## 🔧 Detalhes Técnicos

### Multi-LLM-TS API

```typescript
import { MultiLLMProvider } from 'multi-llm-ts'

// Exemplo de uso
const provider = new MultiLLMProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})

const response = await provider.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' }
  ],
  stream: true,
  onToken: (token) => console.log(token)
})
```

### Compatibilidade Ollama

```typescript
// Ollama via multi-llm-ts
const ollamaProvider = new MultiLLMProvider({
  type: 'ollama',
  endpoint: 'http://localhost:11434',
})

const response = await ollamaProvider.chat({
  model: 'llama3.2',
  messages: [...],
  stream: true,
})
```

---

## 🚨 Riscos e Mitigações

### Risco 1: Breaking Changes
**Mitigação:** 
- Criar adapter layer para manter interface existente
- Testar exaustivamente antes de merge
- Manter branch de rollback

### Risco 2: API Keys Exposure
**Mitigação:**
- Encrypt API keys no banco
- Nunca retornar keys completas na API
- Usar variáveis de ambiente para desenvolvimento

### Risco 3: Custo de APIs Pagas
**Mitigação:**
- Default para Ollama (grátis)
- Warnings na UI sobre custos
- Limite de tokens configurável
- Monitoramento de uso

### Risco 4: Performance
**Mitigação:**
- Cache de providers em memória
- Connection pooling
- Timeout configurável
- Fallback para Ollama se provedor lento

---

## 📊 Critérios de Sucesso

### Funcional
- [ ] Usuário pode adicionar provider OpenAI via UI
- [ ] Usuário pode criar assistente usando GPT-4
- [ ] Assistente GPT-4 responde corretamente
- [ ] Navigator pode usar diferentes providers
- [ ] Ollama continua funcionando sem mudanças

### Técnico
- [ ] Código limpo e testado
- [ ] Cobertura de testes > 80%
- [ ] Documentação completa
- [ ] Sem breaking changes para usuários

### UX
- [ ] UI intuitiva e fácil de usar
- [ ] Feedback claro sobre status de conexão
- [ ] Erros tratados gracefully
- [ ] Performance aceitável (< 200ms overhead)

---

## 📚 Recursos

### Documentação
- [multi-llm-ts GitHub](https://github.com/nbonamy/multi-llm-ts)
- [multi-llm-ts NPM](https://www.npmjs.com/package/multi-llm-ts)
- [Drizzle ORM](https://orm.drizzle.team/)

### Referências no Código
- `packages/interpretation/src/assistants/registry.ts` - Registry atual
- `packages/interpretation/src/assistants/ollama-adapter.ts` - Adapter atual
- `docker-compose.yml` - Config Ollama

---

## 🎯 Próximos Passos Imediatos

1. **Validar o plano** com o time
2. **Criar primeira spec** (Backend - Multi-LLM Adapter)
3. **Atribuir tasks** aos agentes (Backend, Frontend)
4. **Começar implementação** pela Fase 1

---

**Estimativa de tempo:**
- Backend (Fases 1-3): 2-3 dias
- Frontend (Fase 4): 1-2 dias
- Migração e Testes (Fases 5-6): 1 dia
- Documentação (Fase 7): 0.5 dia
- **Total: 4.5-6.5 dias de desenvolvimento**

---

**Última atualização:** 2026-04-03 por @orquestrador
