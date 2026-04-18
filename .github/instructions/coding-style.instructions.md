---
description: "Use ao escrever ou revisar código TypeScript, React ou Next.js. Aplica estilo de código, convenções de nomenclatura e princípios SOLID/DRY."
applyTo: "**/*.{ts,tsx}"
---
# Estilo de Código e Convenções

## Idioma

- **Inglês**: comentários JSDoc, identificadores de código (variáveis, funções, tipos, nomes de arquivo) e textos de UI.
- **Português**: todo conteúdo em markdown dentro de `.github/` e `.specify/` (instruções, prompts, agentes, specs, plans, constitution) e a conversa com o assistente.

## Princípios Gerais

- **DRY (Don't Repeat Yourself)**: extraia lógica compartilhada em funções, hooks ou utilitários reutilizáveis. Se o mesmo padrão aparecer mais de duas vezes, abstraia.
- **Composição em vez de herança**: construa comportamento compondo unidades pequenas e focadas — nunca use hierarquias de herança de classes.
- **Princípios SOLID**:
  - **S** — Responsabilidade Única: cada módulo, componente ou função faz uma coisa só.
  - **O** — Aberto/Fechado: estenda comportamento por composição e props, não modificando código existente.
  - **L** — Substituição de Liskov: subtipos devem ser substituíveis pelos seus tipos base.
  - **I** — Segregação de Interface: prefira interfaces pequenas e focadas a interfaces grandes.
  - **D** — Inversão de Dependência: dependa de abstrações (interfaces/tipos), não de implementações concretas.

## TypeScript

- Use TypeScript estrito — evite `any` e `unknown` sempre que possível.
- Prefira `interface` para formatos de objetos e `type` para uniões e interseções.
- Use `const` por padrão; `let` apenas quando mutação for necessária; nunca `var`.
- Prefira exports nomeados a export default.

## React & Next.js

- Use exclusivamente componentes funcionais — sem class components.
- Extraia lógica reutilizável em custom hooks (prefixo `use`).
- Prefira componentes controlados a não controlados.
- Mantenha tipos específicos de componente no mesmo arquivo.
- Siga as convenções do App Router do Next.js (server components por padrão; `'use client'` somente quando necessário).

## Nomenclatura

- **Arquivos**: `kebab-case` para arquivos e pastas (ex.: `chat-message.tsx`).
- **Componentes**: `PascalCase` (ex.: `ChatMessage`).
- **Funções/variáveis**: `camelCase`.
- **Types/Interfaces**: `PascalCase`, sem prefixo `I`.
- **Constantes**: `UPPER_SNAKE_CASE` para constantes verdadeiras; `camelCase` para valores derivados.
- **Booleanos**: prefixo `is`, `has`, `should`, `can` (ex.: `isLoading`, `hasError`).

## Linting e Formatação

- Todo código deve passar pelo **Biome** antes de ser commitado.
- Execute `pnpm biome check --write` para corrigir automaticamente problemas de lint e formatação.
- O Biome valida arquivos `*.{js,jsx,ts,tsx,json,jsonc}`.
- Configurações do Biome estão em `biome.json` na raiz do projeto.
