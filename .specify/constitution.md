# Constituição — Multi-LLM Chat

## Princípios Fundamentais

### I. Arquitetura em 3 Camadas

Toda feature DEVE ser implementada dentro da arquitetura de packages em 3 camadas. Nenhuma lógica de negócio pode viver diretamente nos apps — apps são camadas finas de orquestração que compõem packages.

- **@multi-llm/interaction** — Mensagens, streaming, canais (MessageBus, MessageStore, StreamHandler, Channel abstractions)
- **@multi-llm/interpretation** — Roteamento de LLMs, seleção de modelo, construção de contexto (Navigator, LLM Router, Ollama Adapter, Registry)
- **@multi-llm/maintenance** — Usuários, salas, auth, configuração (RoomManager, UserManager, Session, FeatureFlags)
- **@multi-llm/types** — Definições de tipos compartilhados consumidos por todos os packages e apps

Packages devem ser autocontidos com fronteiras claras. Dependências entre packages fluem para baixo: interaction e interpretation dependem de types; maintenance depende de types; apps dependem de packages.

### II. TypeScript Estrito

Todo código DEVE usar TypeScript estrito. Isto é INEGOCIÁVEL.

- Nunca use `any`; evite `unknown` exceto em fronteiras do sistema
- Prefira `interface` para formatos de objetos e `type` para uniões e interseções
- Use `const` por padrão; `let` apenas quando mutação for necessária; nunca `var`
- Prefira exports nomeados a export default
- Todas as funções, tipos e componentes exportados devem ter comentários JSDoc

### III. Composição Sobre Herança

Construa comportamento compondo unidades pequenas e focadas. Nunca use hierarquias de herança de classes.

- Use custom hooks (prefixo `use`) para compartilhar lógica com estado entre componentes
- Prefira render props ou children-as-function a HOCs
- Componha UIs complexas a partir de componentes pequenos e de responsabilidade única
- Use o padrão compound component para grupos de componentes relacionados

### IV. Princípios SOLID

- **S — Responsabilidade Única**: cada módulo, componente ou função faz uma coisa só
- **O — Aberto/Fechado**: estenda comportamento por composição e props, não modificando código existente
- **L — Substituição de Liskov**: subtipos devem ser substituíveis pelos seus tipos base
- **I — Segregação de Interface**: prefira interfaces pequenas e focadas a interfaces grandes
- **D — Inversão de Dependência**: dependa de abstrações (interfaces/tipos), não de implementações concretas

### V. Componentes Server-First

Server components são o padrão. Use `'use client'` APENAS quando interatividade for necessária (event handlers, hooks, APIs do browser).

- Busque dados no servidor sempre que possível via Next.js Server Components
- Mantenha o estado o mais próximo possível de onde é usado
- Eleve o estado apenas quando componentes irmãos precisarem compartilhá-lo
- Use React Context com moderação — prefira props e composição primeiro

### VI. Simplicidade

Comece simples, adicione complexidade apenas quando comprovadamente necessário (YAGNI).

- DRY: extraia lógica compartilhada em funções, hooks ou utilitários reutilizáveis. Se o mesmo padrão aparecer mais de duas vezes, abstraia
- Não sobre-engenhare: evite abstrações para operações únicas
- Não adicione features, refatore ou faça melhorias além do que foi pedido
- Toda camada de abstração deve ser justificada

## Stack Tecnológica

### Monorepo
- **Turborepo** para orquestração de builds paralelos
- **pnpm** workspaces para gerenciamento de pacotes
- Estrutura: `apps/` (web, api, workers) + `packages/` (interaction, interpretation, maintenance, types, db) + `tooling/`

### Frontend
- **Next.js** (App Router) — `apps/web`
- **React** (apenas componentes funcionais, sem class components)
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes de UI (em `components/ui/`)

### Backend
- **Hono** — `apps/api` (REST + WebSocket)
- **SurrealDB** — banco de dados
- **Ollama** — inferência local de LLMs (4 instâncias: orchestrator, general, code, creative)

### Qualidade
- **Biome** para linting e formatação (`pnpm biome check --write`)
- Biome valida arquivos `*.{js,jsx,ts,tsx,json,jsonc}`
- Configuração em `biome.json` na raiz do projeto

## Convenções de Nomenclatura

- **Arquivos e pastas**: `kebab-case` (ex.: `chat-message.tsx`)
- **Componentes**: `PascalCase` (ex.: `ChatMessage`)
- **Funções/variáveis**: `camelCase`
- **Types/Interfaces**: `PascalCase`, sem prefixo `I`
- **Constantes**: `UPPER_SNAKE_CASE` para constantes verdadeiras; `camelCase` para valores derivados
- **Booleanos**: prefixo `is`, `has`, `should`, `can` (ex.: `isLoading`, `hasError`)

## Política de Idioma

- **Inglês**: todo código, comentários JSDoc, variáveis, nomes de arquivo, textos de UI e arquivos-fonte
- **Português Brasileiro (pt-BR)**: todo conteúdo markdown dentro de `.github/` e `.specify/` (documentação, memória, instruções, definições de agentes, constitution, specs, plans)

## Padrões de Documentação

- Adicione JSDoc apenas a funções, tipos e componentes **exportados**
- Não documente código óbvio e autodescritivo — prefira nomes claros a comentários
- Use `@param`, `@returns` e `@example` em funções não triviais
- Explique o **porquê**, não o **o quê** — o código já mostra o que faz
- Use `// TODO:` para melhorias planejadas e `// HACK:` para gambiarras temporárias
- Remova código comentado — dependa do histórico do git

## Tratamento de Erros

- Envolva seções de feature com error boundaries para isolar falhas
- Use a convenção `error.tsx` do Next.js para tratamento de erros por rota
- Valide apenas em fronteiras do sistema; não adicione tratamento de erros para cenários impossíveis

## Governança

Esta constituição supersede todas as outras práticas de desenvolvimento. Emendas requerem:
1. Documentação explícita da justificativa para a mudança
2. Revisão e aprovação pelo Lead do projeto
3. Avaliação de compatibilidade retroativa

### Ciclo de Vida de Specs

Todas as features seguem o fluxo **specify → plan → tasks → implement**. Os artefatos ficam em `.specify/specs/[NNN-feature-name]/`.

Quando uma feature é **concluída**:
1. Marcar o epic em `.specify/memory/epics/` como `[DONE]`
2. Mover a pasta da spec para `.specify/specs/done/` (ex.: `.specify/specs/001-persistencia-surrealdb/` → `.specify/specs/done/001-persistencia-surrealdb/`)
3. Atualizar `STATUS.md`

Specs concluídas servem como documentação histórica — úteis para onboarding e referência, sem poluir o diretório de trabalho ativo.

Todos os specs, plans e implementações gerados pelos comandos spec-kit DEVEM cumprir estes princípios. Não-conformidade deve ser documentada e justificada.

**Versão**: 1.1.0 | **Ratificada**: 2026-04-07 | **Última Emenda**: 2026-04-07
