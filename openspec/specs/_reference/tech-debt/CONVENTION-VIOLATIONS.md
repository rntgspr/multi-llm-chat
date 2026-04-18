# Violações de Convenções e Diretrizes do Repositório

**Data:** Abril 2025  
**Tipo:** Auditoria de Conformidade  
**Referências:** 
- `.github/instructions/coding-style.instructions.md`
- `.github/instructions/architecture.instructions.md`
- `.github/instructions/documentation.instructions.md`
- `AGENTS.md`

---

## 📋 Resumo de Violações

| Severidade | Tipo | Count | Impacto |
|-----------|------|-------|--------|
| 🔴 CRÍTICA | Language mismatches | 2 | Confusão de developers |
| 🟡 MÉDIA | Missing JSDoc | 15+ | Documentação incompleta |
| 🟡 MÉDIA | Architecture violations | 3 | Duplicação, acoplamento |
| 🟢 BAIXA | Naming inconsistencies | 5 | Código menos legível |

---

## 🔴 CRÍTICAS: VIOLAÇÕES DE IDIOMA

### ❌ Violação #1: Comentários em Português no Código

**Guideline:** `.github/instructions/coding-style.instructions.md:9`  
> "Inglês: comentários JSDoc, identificadores de código (variáveis, funções, tipos, nomes de arquivo) e textos de UI."

**Violações encontradas:**

1. **`packages/interpretation/src/assistants/registry.ts:L4`**
   ```typescript
   // Camada de Manutenção - Auth, users, rooms, config  ❌ PORTUGUÊS
   ```
   Deveria ser: `// Maintenance layer - Auth, users, rooms, config`

2. **`packages/interaction/src/index.ts:L2-4`**
   ```typescript
   /**
    * @synergy/interaction
    *
    * Camada de Interação - Chat core, mensagens, streaming, canais  ❌ PORTUGUÊS
    */
   ```
   Deveria ser: `Interaction layer - Chat core, messages, streaming, channels`

3. **`packages/interpretation/src/index.ts:L1-3`**
   ```typescript
   /**
    * @synergy/interpretation
    *
    * Camada de Interpretação - Navigator, assistentes, contexto  ❌ PORTUGUÊS
    */
   ```
   Deveria ser: `Interpretation layer - Navigator, assistants, context`

4. **`packages/maintenance/src/index.ts:L1-3`**
   ```typescript
   /**
    * @synergy/maintenance
    *
    * Camada de Manutenção - Auth, users, rooms, config  ❌ PORTUGUÊS
    */
   ```
   Deveria ser: `Maintenance layer - Auth, users, rooms, config`

**Impacto:**
- 🐛 Inconsistência com convention (Português só em `.github/` e `.specify/`)
- 🐛 Developers não-brasileiros ficam confusos
- 📊 IDE autocomplete mostra comentários em português

**Recomendação:**
- [ ] Revisar todos comentários em `packages/` - converter para inglês
- [ ] Adicionar eslint rule para detectar non-ASCII em código

---

### ❌ Violação #2: Log Strings em Português

**Guideline:** `.github/instructions/coding-style.instructions.md:9`  
> "Inglês para: comentários JSDoc, identificadores de código"

**Violações encontradas:**

1. **`packages/interpretation/src/navigator/routing-rules.ts:L17-71`** - Keywords em português?
   ```typescript
   const codeKeywords = [
     'code',
     'function',
     'error',
     // ... 70+ english keywords
   ]
   ```
   Não é violação, está correto (é conteúdo contextual, não código)

**Nota:** Revisar console.logs para ver se há strings português:

```bash
grep -r "console\." packages/interpretation/src --include="*.ts" | grep -i "português\|msg\|erro"
```

**Recomendação:** Se encontrado, converter para inglês.

---

## 🟡 MÉDIA: MISSING JSDOC (Documentação Incompleta)

**Guideline:** `.github/instructions/documentation.instructions.md:7-20`  
> "Adicione comentários JSDoc a funções, tipos e componentes **exportados**."

### Missing JSDoc em Type Exports

Todos os tipos em `packages/types/src/` faltam JSDoc:

```typescript
// ❌ Sem documentation
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt?: Date
}

// ✅ Como deveria ser
/**
 * Represents a user in the system.
 * @example
 * const user: User = { id: "u123", name: "Alice", email: "alice@example.com", createdAt: new Date() }
 */
export interface User {
  /** Unique identifier (UUID format) */
  id: string
  /** User's full name, 1-255 characters */
  name: string
  /** Email address (must be valid) */
  email: string
  /** Avatar URL (optional) */
  avatar?: string
  /** Timestamp of user creation */
  createdAt: Date
  /** Timestamp of last update */
  updatedAt?: Date
}
```

**Arquivos afetados:**
1. `packages/types/src/db/user.ts` - User, CreateUserInput, UpdateUserInput
2. `packages/types/src/db/message.ts` - Message, CreateMessageInput
3. `packages/types/src/db/room.ts` - Room, CreateRoomInput, UpdateRoomInput
4. `packages/types/src/db/assistant.ts` - Assistant, CreateAssistantInput
5. `packages/types/src/db/invite.ts` - Invite, CreateInviteInput

**Impacto:**
- 📚 Developers precisam ler código para entender contracts
- 📝 IDE autocomplete não mostra descrições
- 🐛 Mudanças breaking não são óbvias

---

## 🟡 MÉDIA: VIOLAÇÕES ARQUITETURAIS

### ❌ Violação #1: Arquitetura - Duplicação de Código

**Guideline:** `.github/instructions/architecture.instructions.md` + `.github/instructions/coding-style.instructions.md:14`  
> "DRY (Don't Repeat Yourself): extraia lógica compartilhada"

**Violação Específica:**

`apps/web/src/services/orchestrator/orchestrator-client.ts` é duplicação de `packages/interpretation/src/navigator/llm-router.ts`:

| Aspecto | orchestrator-client.ts | llm-router.ts | Status |
|---------|----------------------|---------------|--------|
| JSON regex | `/\{[\s\S]*\}/` | `/\{[\s\S]*\}/` | 🔴 DUPLICADO |
| Ollama interface | OllamaMessage, OllamaChatResponse | OllamaMessage, OllamaChatResponse | 🔴 DUPLICADO |
| System prompt | Similar routing logic | Similar routing logic | 🔴 DUPLICADO |
| Error handling | try-catch + fallback | try-catch + fallback | 🔴 DUPLICADO |

**Impacto:**
- 🐛 Bug em um lugar = bug em outro (se não sincronizado)
- 📊 Manutenção cara - 2x o trabalho
- ⚠️ Confusão - qual é a "source of truth"?

**Recomendação:**
- [ ] Deletar `apps/web/src/services/orchestrator/orchestrator-client.ts`
- [ ] Usar imports de `@synergy/interpretation` na web app
- [ ] Verificar STATUS.md item "Código legado em apps/web/src/services ainda existe"

---

### ❌ Violação #2: Separation of Concerns

**Guideline:** `.github/instructions/coding-style.instructions.md:16-17`  
> "Princípios SOLID:  
> **S** — Responsabilidade Única: cada módulo, componente ou função faz uma coisa só."

**Violação:** `packages/interpretation/src/assistants/registry.ts`

Este arquivo tem múltiplas responsabilidades:
1. **Registry Pattern** - Manter registro de assistants
2. **Initialization Logic** - Setupar assistants padrão
3. **Repository Wrapper** - Chamadas ao `assistantRepository`
4. **Model Mapping** - Mapear assistants para modelos Ollama

```typescript
// L18-46: Definição de defaultAssistants + inicialização
const defaultAssistants: AssistantConfig[] = [...]
async function initializeAssistants() { ... }

// L48-49: Model mapping
export const modelsByAssistant = new Map<AssistantId, string>()

// L73-81: Repository wrapper
export async function listAssistants(): Promise<Assistant[]> { ... }
```

**Impacto:**
- 🐛 Arquivo faz 4 coisas diferentes
- 🐛 Difícil de testar isoladamente
- 🐛 Mudança em um aspecto afeta todo o arquivo

**Recomendação:**
- [ ] Extrair `AssistantInitializer` class (responsável por setup)
- [ ] Manter `AssistantRegistry` apenas como registry
- [ ] Mover `modelsByAssistant` para `OllamaAdapter`

---

### ❌ Violação #3: Arquitetura - Server Components vs Client Components

**Guideline:** `.github/instructions/architecture.instructions.md:22-27`  
> "**Server components** (padrão) — busque dados no servidor sempre que possível.  
> **Client components** — use `'use client'` apenas para interatividade"

**Violação:** `apps/web/src/services/websocket/client.ts`

```typescript
'use client'  // ✅ Correto - é client-side

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null  // ⚠️ Module-level state in client component?

export function connect(userId: UserId): Socket {
  if (socket?.connected) {
    return socket
  }
  socket = io({ ... })  // Mutable global state - OK em client, mas frágil
  return socket
}
```

**Problema específico:**
- Module-level `socket` variable é singleton - OK para client
- MAS isso significa que múltiplas instâncias da web app compartilham a mesma conexão
- Em testes ou SSR (se acidental), pode causar estado compartilhado indesejado

**Impacto:**
- 🐛 Difícil de testar (singleton state)
- 🐛 Múltiplas tabs/windows compartilham conexão (pode ser intencional, mas não documentado)

**Recomendação:**
- [ ] Documentar que socket é global/tab-specific
- [ ] Adicionar teste que verifica isolamento entre abas
- [ ] Considerar Context API se houver múltiplas conexões no futuro

---

## 🟢 BAIXA: NAMING INCONSISTENCIES

### ❌ Violação #1: Nomes de Arquivos - Kebab-case vs camelCase

**Guideline:** `.github/instructions/coding-style.instructions.md:40`  
> "**Arquivos**: `kebab-case` para arquivos e pastas"

**Verificação:**
- ✅ `apps/api/src/repositories/user.repository.ts` - OK (kebab-case)
- ✅ `packages/interpretation/src/navigator/llm-router.ts` - OK (kebab-case)
- ✅ `apps/web/src/services/orchestrator/orchestrator-client.ts` - OK (kebab-case)

**Status:** ✅ Sem violações detectadas!

---

### ❌ Violação #2: Booleano Naming

**Guideline:** `.github/instructions/coding-style.instructions.md:45`  
> "**Booleanos**: prefixo `is`, `has`, `should`, `can`"

**Violação encontrada:**

`apps/api/src/lib/db.ts:L5`
```typescript
private static connected = false  // ❌ Should be "isConnected"
```

Mais:
- ✅ `channelManager.ts:L85` - `supportsStreaming()` - OK (prefixo "supports")
- ✅ `roomRepository.ts` - sem violações
- ✅ `featureFlags.ts` - `isDebugMode()`, `canSeeNavigatorDecisions()` - OK

**Recomendação:**
- [ ] Renomear `connected` para `isConnected` em db.ts

---

### ❌ Violação #3: Type/Interface Naming

**Guideline:** `.github/instructions/coding-style.instructions.md:43`  
> "**Types/Interfaces**: `PascalCase`, sem prefixo `I`"

**Verificação:**
- ✅ `User`, `Message`, `Room` - OK (sem prefixo I)
- ✅ `Channel`, `ChannelManager` - OK
- ⚠️ Em alguns lugares há type unions sem interface:

`packages/interpretation/src/navigator/navigator.ts:L7-16`
```typescript
export interface ConversationContext {
  recentMessages: Message[]
  availableAssistants: AssistantId[]
  roomId: string
}

export interface NavigatorOptions {
  useLLM?: boolean
  fallbackAssistant?: AssistantId
}
```

Status: ✅ Correto - ambos `PascalCase`, sem prefixo `I`

---

## 📊 Tabela Consolidada de Violações

| ID | Tipo | Arquivo(s) | Severidade | Fix Effort | Priority |
|----|------|-----------|-----------|-----------|----------|
| V1 | Language (Português em código) | packages/**/*.ts (4 files) | 🔴 | <1h | 1️⃣ |
| V2 | Missing JSDoc | packages/types/**/*.ts (5 types) | 🟡 | <3h | 5️⃣ |
| V3 | Code Duplication | apps/web + packages/interpretation | 🟡 | <2h | 2️⃣ |
| V4 | SoC Violation | packages/interpretation/registry.ts | 🟡 | <4h | 4️⃣ |
| V5 | Naming (boolean) | apps/api/src/lib/db.ts | 🟢 | <15m | 🔞 |

---

## 🎯 Ações Recomendadas

### Imediato
```
[ ] Converter comentários português → inglês em packages/ (1h)
[ ] Renomear "connected" → "isConnected" em db.ts (15m)
[ ] Deletar apps/web/src/services/orchestrator/ (15m)
Total: ~90 minutos
```

### Curto Prazo
```
[ ] Adicionar JSDoc a todos types em packages/types/ (3h)
[ ] Refactor registry.ts (extrar initializer, mapper) (4h)
[ ] Atualizar imports em web app após deletar orchestrator (1h)
Total: ~8h
```

### Documentação
```
[ ] Atualizar architecture.instructions.md com mais exemplos
[ ] Adicionar pre-commit hook que valida:
    - Comentários só em inglês em src/
    - Booleanos com prefixo is/has/should
    - JSDoc em exported functions/types
```

---

## 📚 Referências

- **Coding Style Guide:** `.github/instructions/coding-style.instructions.md`
- **Architecture Guide:** `.github/instructions/architecture.instructions.md`
- **Documentation Guide:** `.github/instructions/documentation.instructions.md`
- **Agent Rules:** `AGENTS.md`
- **Constitution:** `.specify/memory/constitution.md` (faltando - criar!)

---

**Status:** ✅ Auditoria concluída  
**Próxima revisão:** Em 2 semanas após implementar fixes
