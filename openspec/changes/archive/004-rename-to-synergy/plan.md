# Plano de Implementação: Renomear Projeto para Synergy

**Branch**: `004-rename-to-synergy` | **Data**: 2025-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Especificação da feature em `.specify/specs/004-rename-to-synergy/spec.md`

**Nota**: Este plano foi gerado pelo comando `/speckit.plan` e fornece uma estratégia detalhada e sequencial para renomear o projeto de "multi-llm" para "synergy".

## Resumo

Este plano implementa a renomeação completa do projeto de **@multi-llm** para **@synergy** através de uma estratégia de execução em camadas que garante zero downtime de desenvolvimento e integridade do build. A abordagem prioriza:

1. **Atomicidade** - Renomeação de packages internos primeiro (foundation layer)
2. **Propagação** - Atualização de dependências e imports (dependency layer)
3. **Infraestrutura** - Ajuste de Docker, CI/CD e configurações (ops layer)
4. **Documentação** - Consistência de nomenclatura em toda documentação (knowledge layer)

**Resultado esperado**: 61+ arquivos TypeScript, 9 package.json, 3 arquivos Docker Compose, 20+ arquivos de documentação atualizados sem quebrar o build ou introduzir inconsistências.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 6.0.3, Node.js (LTS)
**Dependências Principais**: pnpm 10.12.1 (workspace manager), Turbo 2.9.6 (build orchestrator), Biome 2.4.12 (linter/formatter), Hono (API framework), Next.js (web framework)
**Armazenamento**: SurrealDB v2 (chat persistence), Redis 7 (cache/pub-sub)
**Testes**: Não detectado ainda (FR-003 menciona `pnpm test` existir)
**Plataforma Alvo**: Docker containers (multi-arch), servidor Linux (Node.js runtime)
**Tipo de Projeto**: Full-stack web service (monorepo: 3 apps + 5 packages internos)
**Metas de Performance**: N/A para esta feature (refactoring de nomenclatura)
**Restrições**: Zero breaking changes durante build, pnpm workspace protocol deve permanecer funcional, Docker compose networks devem ser compatíveis com versão existente
**Escala/Escopo**: 
  - **Packages afetados**: 9 (1 root + 3 apps + 5 packages)
  - **Arquivos TypeScript**: 61+ com imports `@multi-llm/*`
  - **Arquivos Docker**: 3 compose files + 2 Dockerfiles
  - **Documentação**: 20+ arquivos markdown (.github, .specify, specs)
  - **Infraestrutura**: Container names, networks, volumes, env vars

## Verificação da Constitution

*GATE: Deve passar antes da pesquisa da Fase 0. Re-verificar após design da Fase 1.*

### Gate 1: Coordenação de Branch e Git Actions

**Status**: ✅ **PASSA**

**Princípio da Constitution**: 
> NÃO criar NENHUMA branch ou executar QUALQUER ação usando git sem coordenação prévia com o time de liderança.

**Verificação**:
- Branch `004-rename-to-synergy` já foi criada via script `setup-plan.sh`
- Esta feature é puramente de refactoring (rename) - não cria branches adicionais
- Não há operações git automatizadas que disparem pipelines ou deploys
- Mudanças são isoladas em branch dedicada para revisão antes de merge

**Conclusão**: Não há violação. A feature segue o protocolo de governança estabelecido.

### Gate 2: Simplicidade e Complexidade Justificada

**Status**: ✅ **PASSA**

**Avaliação**:
- Esta feature **remove** complexidade ao eliminar inconsistência de nomenclatura
- Não adiciona novos componentes, abstrações ou dependências
- Renomeação é uma operação de manutenção preventiva que melhora clareza
- Impacto é temporário (durante execução) mas benefício é permanente (consistência)

**Conclusão**: Feature está alinhada com princípio de simplicidade.

### Resultado da Verificação

**✅ TODOS OS GATES PASSAM** - Prosseguir com Fase 0 (Research)

## Estrutura do Projeto

### Documentação (desta feature)

```text
specs/004-rename-to-synergy/
├── spec.md              # Especificação completa da feature (input)
├── plan.md              # Este arquivo (saída do comando /speckit.plan)
├── research.md          # Saída da Fase 0 (comando /speckit.plan)
├── data-model.md        # N/A para esta feature (não há entidades de domínio)
├── quickstart.md        # Saída da Fase 1 (guia de execução passo-a-passo)
├── contracts/           # N/A para esta feature (não há contratos de API)
└── tasks.md             # Saída da Fase 2 (comando /speckit.tasks)
```

### Código Fonte (raiz do repositório)

```text
multi-llm-chat/                    # Monorepo root
├── package.json                   # @multi-llm/root → @synergy/root
├── pnpm-workspace.yaml            # Sem mudanças (paths permanecem)
├── pnpm-lock.yaml                 # REGENERAR completamente
├── turbo.json                     # Sem mudanças (não referencia nomes)
├── biome.json                     # Sem mudanças (config agnóstica)
│
├── apps/                          # Aplicações (3 total)
│   ├── api/
│   │   ├── package.json           # @multi-llm/api → @synergy/api
│   │   ├── Dockerfile             # Atualizar referencias de paths
│   │   └── src/**/*.ts            # ~20 arquivos com imports
│   ├── web/
│   │   ├── package.json           # @multi-llm/web → @synergy/web
│   │   ├── Dockerfile             # Atualizar referencias de paths
│   │   └── src/**/*.{ts,tsx}      # ~30 arquivos com imports
│   └── workers/
│       ├── package.json           # @multi-llm/workers → @synergy/workers
│       └── src/**/*.ts            # ~11 arquivos com imports
│
├── packages/                      # Packages internos (5 total)
│   ├── types/
│   │   └── package.json           # @multi-llm/types → @synergy/types
│   ├── db/
│   │   ├── package.json           # @multi-llm/db → @synergy/db
│   │   └── src/**/*.ts            # Imports internos
│   ├── platform/
│   │   ├── package.json           # @multi-llm/platform → @synergy/platform
│   │   └── src/**/*.ts            # Imports de @multi-llm/db, types
│   ├── interaction/
│   │   └── package.json           # @multi-llm/interaction → @synergy/interaction
│   └── interpretation/
│       └── package.json           # @multi-llm/interpretation → @synergy/interpretation
│
├── docker-compose.yml             # Infra: DB + cache (multi-llm-network → synergy-network)
├── docker-compose.apps.yml        # Apps: web + api (multi-llm-web → synergy-web)
├── docker-compose.llm.yml         # LLM services (multi-llm-agents → synergy-agents)
│
├── .github/                       # Documentação e agentes
│   ├── README.md                  # "Multi-LLM Chat" → "Synergy"
│   ├── copilot-instructions.md    # Atualizar contexto do projeto
│   └── agents/*.agent.md          # 3 agentes (lead, developer, critic)
│
└── .specify/                      # Memória e specs do projeto
    ├── constitution.md            # "Multi-LLM Chat" → "Synergy"
    ├── memory/
    │   ├── constitution.md        # Duplicado - atualizar
    │   ├── STATUS.md              # Referências ao projeto
    │   ├── epics/*.md             # 7 epics com menções
    │   └── tech-debt/*.md         # 4 arquivos de análise
    └── specs/
        ├── 001-*/, 002-*/, 003-*/  # Specs anteriores (atualizar menções)
        └── 004-rename-to-synergy/  # Esta spec
```

**Decisão de Estrutura**: 
O projeto usa a estrutura **monorepo clássica** (apps/ + packages/) gerenciada por pnpm workspaces e Turbo. Não há mudanças estruturais - apenas renomeação de nomes de packages nos `package.json` e atualização de imports em código TypeScript. A hierarquia de diretórios permanece intacta.

## Rastreamento de Complexidade

**Não aplicável** - Esta feature não introduz violações à Constitution que requerem justificativa.

A renomeação é uma operação de manutenção que:
- Não adiciona novos componentes ou abstrações
- Não introduz novas dependências externas
- Não aumenta a complexidade arquitetural
- Reduz inconsistências de nomenclatura (benefício líquido positivo)

---

## 📋 Fase 0: Pesquisa e Decisões Técnicas

### Objetivos

1. **Estratégia de Execução**: Determinar a ordem ótima de operações para evitar quebrar o build
2. **Tooling**: Identificar ferramentas para automatização (find/replace, scripts, IDE refactoring)
3. **Validação**: Definir checkpoints para verificar integridade após cada camada
4. **Rollback**: Planejar estratégia de reversão caso problemas sejam detectados
5. **Cache Management**: Pesquisar comportamento de pnpm cache e node_modules durante rename

### Perguntas de Pesquisa

#### Q1: Ordem de Execução - Package Rename vs Import Update

**Contexto**: Se renomearmos `package.json` antes de atualizar imports, o build quebra. Se atualizarmos imports antes, TypeScript não resolve os módulos.

**Decisão Necessária**: 
- Opção A: Rename packages → Update imports atomicamente (mesma transação Git)
- Opção B: Rename packages → Clean install → Update imports
- Opção C: Use temporary aliases/redirects durante transição

**Critério**: Minimizar janela de "broken build" e evitar estado inconsistente

---

#### Q2: pnpm Cache Invalidation

**Contexto**: pnpm mantém cache global de packages em `~/.pnpm-store` e lockfile com hashes. Renomear packages pode criar entries duplicadas ou stale references.

**Decisão Necessária**:
- Quando executar `pnpm store prune`?
- É necessário `rm -rf node_modules pnpm-lock.yaml` antes de `pnpm install`?
- Lockfile deve ser commitado no mesmo commit ou separado?

**Critério**: Garantir que CI/CD e máquinas de outros devs tenham ambiente limpo

---

#### Q3: Docker Layer Cache Strategy

**Contexto**: Dockerfiles fazem `COPY package*.json` e `RUN pnpm install` em layers separados. Mudar `package.json` invalida layer cache.

**Decisão Necessária**:
- Rebuild completo é inevitável?
- Há estratégia para preservar cache de dependencies externas?
- Docker Compose networks podem ser renomeadas sem down/up completo?

**Critério**: Minimizar tempo de rebuild para devs locais

---

#### Q4: IDE Refactoring Tools vs Manual Find/Replace

**Contexto**: VSCode, Cursor e outros IDEs oferecem "rename symbol" e "find/replace in files". Scripts bash podem usar `sed`, `rg --replace`, ou `find -exec`.

**Decisão Necessária**:
- Usar IDE refactoring (TypeScript Language Server aware)?
- Usar script bash automatizado (reproduzível, mas risco de falsos positivos)?
- Abordagem híbrida (packages manual, imports automatizado)?

**Critério**: Precisão, auditabilidade, reproduzibilidade

---

#### Q5: Validação Progressiva vs Validação Final

**Contexto**: Podemos validar após cada camada (packages → imports → docker → docs) ou apenas no final.

**Decisão Necessária**:
- Checkpoints intermediários:
  - Após rename de packages: `pnpm install` deve completar?
  - Após update de imports: `pnpm typecheck` deve passar?
  - Após Docker updates: `docker-compose config` deve validar?
- Ou validação única final: `pnpm build && docker-compose up`?

**Critério**: Balance entre feedback rápido e overhead de execução

---

### Tarefas de Research

**Task 1**: Analisar casos de sucesso de package rename em monorepos pnpm
- Buscar: "pnpm workspace rename packages" + best practices
- Documentar: Ordem de operações recomendada

**Task 2**: Investigar comportamento de pnpm workspace protocol (`workspace:*`)
- Confirmar: Se `workspace:*` é resiliente a package renames
- Testar: Se pnpm resolve dependências apenas por nome ou também por path

**Task 3**: Verificar impacto de Docker Compose name changes
- Confirmar: Se renomear `name:` em compose file quebra volumes/networks existentes
- Documentar: Se é necessário `docker-compose down -v` antes de rename

**Task 4**: Avaliar ferramentas de refactoring
- Avaliar: `ts-morph` (TypeScript AST manipulation)
- Avaliar: `jscodeshift` (codemod framework)
- Avaliar: `ripgrep --replace` + manual review
- Recomendar: Ferramenta mais adequada para 61+ arquivos

**Task 5**: Definir estratégia de validação
- Especificar: Comandos exatos para cada checkpoint
- Especificar: Critérios de pass/fail para cada validação
- Documentar: Plano de rollback se validação falhar

---

### Output Esperado: `research.md`

Documento estruturado com:

```markdown
# Research: Estratégia de Renomeação de Packages

## Decisão 1: Ordem de Execução
**Escolhido**: [Opção]
**Rationale**: [Por quê]
**Alternativas Rejeitadas**: [O que não funcionou]

## Decisão 2: pnpm Cache Management
[...]

## Decisão 3: Docker Strategy
[...]

## Decisão 4: Tooling
[...]

## Decisão 5: Validation Checkpoints
[...]

## Comandos de Validação
- Checkpoint 1: `pnpm install && pnpm typecheck`
- Checkpoint 2: `pnpm build`
- Checkpoint 3: `docker-compose config`
- Checkpoint 4: `git grep -i "multi-llm" | grep -v ".git/"`
```

---

## 📐 Fase 1: Design de Execução e Quickstart

### Objetivos

1. **Sequência Detalhada**: Ordem exata de operações (qual arquivo, qual comando, qual verificação)
2. **Quickstart Guide**: Manual passo-a-passo para executar a renomeação
3. **Safety Checks**: Validações intermediárias para detectar problemas cedo
4. **Rollback Procedure**: Comandos para reverter se algo der errado

### Artefatos

#### 1. Quickstart.md - Guia de Execução Passo-a-Passo

**Estrutura**:

```markdown
# Quickstart: Renomear Projeto para Synergy

## Pré-requisitos

- [ ] Git working tree limpo (sem uncommitted changes)
- [ ] Branch `004-rename-to-synergy` checked out
- [ ] Docker parado (`docker-compose down && docker-compose -f docker-compose.llm.yml down`)
- [ ] Backup do branch atual: `git branch backup-pre-rename`

## Fase 1: Packages Internos (Foundation Layer)

### 1.1 Renomear package.json de cada package

**Arquivos** (9 total):
1. `./package.json`: `@multi-llm/root` → `@synergy/root`
2. `apps/api/package.json`: `@multi-llm/api` → `@synergy/api`
3. `apps/web/package.json`: `@multi-llm/web` → `@synergy/web`
4. `apps/workers/package.json`: `@multi-llm/workers` → `@synergy/workers`
5. `packages/types/package.json`: `@multi-llm/types` → `@synergy/types`
6. `packages/db/package.json`: `@multi-llm/db` → `@synergy/db`
7. `packages/platform/package.json`: `@multi-llm/platform` → `@synergy/platform`
8. `packages/interaction/package.json`: `@multi-llm/interaction` → `@synergy/interaction`
9. `packages/interpretation/package.json`: `@multi-llm/interpretation` → `@synergy/interpretation`

**Validação**:
```bash
# Verificar que nenhum @multi-llm/* permanece em package.json
find . -name "package.json" -not -path "*/node_modules/*" -exec grep -l "@multi-llm/" {} \;
# Esperado: nenhum output
```

### 1.2 Atualizar dependencies em package.json

**Arquivos com dependencies internas**:
- `apps/api/package.json`: 4 dependencies (`@synergy/interaction`, `interpretation`, `platform`, `types`)
- `apps/web/package.json`: dependencies (TBD - verificar arquivo)
- `apps/workers/package.json`: dependencies (TBD - verificar arquivo)
- `packages/platform/package.json`: 2 dependencies (`@synergy/db`, `types`)
- Outros packages conforme cross-dependencies

**Comando automatizado**:
```bash
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.next/*" \
  -exec sed -i '' 's/"@multi-llm\//"@synergy\//g' {} \;
```

**Validação**:
```bash
pnpm install
# Esperado: instalação completa sem erros de "workspace not found"
```

## Fase 2: Imports TypeScript (Dependency Layer)

### 2.1 Atualizar imports em código

**Comando automatizado** (usando ripgrep):
```bash
# Preview (dry-run)
rg --files-with-matches '@multi-llm/' apps packages \
  --type ts --type tsx

# Execute replacement
rg --files-with-matches '@multi-llm/' apps packages \
  --type ts --type tsx \
  | xargs sed -i '' 's/@multi-llm\//@synergy\//g'
```

**Validação**:
```bash
pnpm typecheck
# Esperado: typecheck passa sem erros de módulo não resolvido

# Verificar que nenhum import antigo permanece
rg '@multi-llm/' apps packages --type ts --type tsx
# Esperado: nenhum resultado
```

### 2.2 Rebuild e Test

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Se tests existirem
pnpm test

# Linting
pnpm biome check
```

## Fase 3: Docker e Infraestrutura (Ops Layer)

### 3.1 Atualizar Docker Compose files

**Arquivo**: `docker-compose.yml`
- Line 1: `# Multi-LLM Chat` → `# Synergy`
- Line 14: `name: multi-llm-chat` → `name: synergy-chat`
- Line 22: `container_name: multi-llm-surrealdb` → `synergy-surrealdb`
- Line 33: `SURREAL_NAMESPACE: multi_llm_chat` → `synergy_chat`
- Line 38: `multi-llm-network` → `synergy-network`
- Line 52: `container_name: multi-llm-redis` → `synergy-redis`
- Line 58: `multi-llm-network` → `synergy-network`
- Line 74-76: network name references

**Arquivo**: `docker-compose.apps.yml`
- Header comment
- `name:` directive
- Container names
- Network references

**Arquivo**: `docker-compose.llm.yml`
- Header comment
- `name:` directive
- Network references

**Comando automatizado**:
```bash
for file in docker-compose*.yml; do
  sed -i '' 's/multi-llm/synergy/g' "$file"
  sed -i '' 's/Multi-LLM/Synergy/g' "$file"
done
```

**Validação**:
```bash
docker-compose config
docker-compose -f docker-compose.apps.yml config
docker-compose -f docker-compose.llm.yml config
# Esperado: configuração válida, sem warnings
```

### 3.2 Atualizar Dockerfiles

**Arquivo**: `apps/api/Dockerfile`
**Arquivo**: `apps/web/Dockerfile`

Verificar se há referências a paths ou nomes de packages - atualizar se necessário.

**Validação**:
```bash
# Test build de uma imagem
docker build -t synergy-api:test -f apps/api/Dockerfile .
# Esperado: build completa sem erros
```

### 3.3 Restart Docker Services

```bash
# Stop antigos (se ainda rodando)
docker-compose down
docker-compose -f docker-compose.apps.yml down
docker-compose -f docker-compose.llm.yml down

# Start novos
docker-compose up -d
docker-compose logs -f
# Verificar que containers iniciam corretamente
```

## Fase 4: Documentação (Knowledge Layer)

### 4.1 Arquivos Principais

**Arquivos**:
1. `.github/README.md`
2. `.github/copilot-instructions.md`
3. `.github/agents/lead.agent.md`
4. `.github/agents/developer.agent.md`
5. `.github/agents/critic.agent.md`

**Comando**:
```bash
find .github -name "*.md" \
  -exec sed -i '' 's/multi-llm/synergy/g' {} \; \
  -exec sed -i '' 's/Multi-LLM/Synergy/g' {} \;
```

### 4.2 Memória e Constitution

**Arquivos**:
- `.specify/constitution.md`
- `.specify/memory/constitution.md`
- `.specify/memory/STATUS.md`
- `.specify/memory/epics/*.md`
- `.specify/memory/tech-debt/*.md`

**Comando**:
```bash
find .specify/memory -name "*.md" \
  -exec sed -i '' 's/multi-llm/synergy/g' {} \; \
  -exec sed -i '' 's/Multi-LLM/Synergy/g' {} \;

# Constitution files (cuidado com sections específicas)
sed -i '' 's/multi-llm/synergy/g' .specify/constitution.md
sed -i '' 's/Multi-LLM Chat/Synergy/g' .specify/constitution.md
```

### 4.3 Specs Anteriores

**Arquivos**: `.specify/specs/001-*/`, `002-*/`, `003-*/`

```bash
find .specify/specs -name "*.md" -not -path "*/004-*" \
  -exec sed -i '' 's/@multi-llm\//@synergy\//g' {} \; \
  -exec sed -i '' 's/Multi-LLM/Synergy/g' {} \;
```

### 4.4 Validação Final

```bash
# Busca global por referências antigas
git grep -i "multi-llm" \
  | grep -v ".git/" \
  | grep -v "pnpm-lock.yaml" \
  | grep -v "node_modules"

# Esperado: apenas resultados em contextos históricos justificados
# (ex: "renamed from multi-llm to synergy" em changelogs)
```

## Fase 5: Regenerar Lockfile e Commit

### 5.1 Clean Install

```bash
# Remove cache e lockfile antigos
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Verificar que lockfile tem apenas @synergy/*
grep "@multi-llm" pnpm-lock.yaml
# Esperado: nenhum resultado
```

### 5.2 Commit

```bash
git add -A
git status
# Review changes carefully

git commit -m "feat: rename project from multi-llm to synergy

- Rename all packages from @multi-llm/* to @synergy/*
- Update 61+ TypeScript imports
- Update Docker Compose services and networks
- Update all documentation and agent instructions
- Regenerate pnpm-lock.yaml

Closes #004"
```

## Rollback Procedure

Se algo der errado em qualquer fase:

```bash
# Discard todas as mudanças
git reset --hard HEAD

# OU restaurar do backup
git checkout backup-pre-rename

# Clean install
rm -rf node_modules
pnpm install
```

## Validação de Sucesso Completo

### Checklist Final

- [ ] `pnpm build` completa sem erros
- [ ] `pnpm typecheck` passa
- [ ] `pnpm biome check` sem erros relacionados a imports
- [ ] `docker-compose up` inicia todos os containers
- [ ] `git grep -i "multi-llm"` retorna apenas contextos históricos
- [ ] `grep "@multi-llm" pnpm-lock.yaml` retorna vazio
- [ ] Aplicação roda localmente sem erros de módulo não encontrado
```

#### 2. Atualização do Agent Context

**Não aplicável para esta feature** - Apenas se houvesse nova tecnologia introduzida. A renomeação não altera o stack técnico.

---

### Re-verificação da Constitution (Pós-Design)

**Status**: ✅ **MANTÉM APROVAÇÃO**

**Mudanças desde avaliação inicial**: Nenhuma

**Conclusão**: Design da Fase 1 não introduziu complexidade adicional ou violações. Gates permanecem verdes.

---

## 📊 Análise de Impacto Detalhada

### Arquivos Afetados por Categoria

#### Category 1: Package Manifests (9 arquivos)

| Arquivo | Mudança | Criticidade | Validação |
|---------|---------|-------------|-----------|
| `./package.json` | `name: @multi-llm/root` → `@synergy/root` | 🔴 Alta | `pnpm install` |
| `apps/api/package.json` | `name` + 4 dependencies | 🔴 Alta | `pnpm install` |
| `apps/web/package.json` | `name` + dependencies | 🔴 Alta | `pnpm install` |
| `apps/workers/package.json` | `name` + dependencies | 🔴 Alta | `pnpm install` |
| `packages/types/package.json` | `name` | 🔴 Alta | `pnpm install` |
| `packages/db/package.json` | `name` | 🔴 Alta | `pnpm install` |
| `packages/platform/package.json` | `name` + 2 dependencies | 🔴 Alta | `pnpm install` |
| `packages/interaction/package.json` | `name` | 🔴 Alta | `pnpm install` |
| `packages/interpretation/package.json` | `name` | 🔴 Alta | `pnpm install` |

**Impacto**: Se um arquivo for esquecido, todo o workspace quebra.

#### Category 2: TypeScript Source Code (61+ arquivos)

| Diretório | Arquivos Estimados | Padrão de Import | Validação |
|-----------|-------------------|------------------|-----------|
| `apps/api/src/` | ~20 | `import X from '@multi-llm/Y'` | `pnpm typecheck` |
| `apps/web/src/` | ~30 | `import X from '@multi-llm/Y'` | `pnpm typecheck` |
| `apps/workers/src/` | ~11 | `import X from '@multi-llm/Y'` | `pnpm typecheck` |
| `packages/*/src/` | Variable | Imports entre packages | `pnpm typecheck` |

**Impacto**: Se um import for esquecido, TypeScript compilation falha.

#### Category 3: Docker Infrastructure (5 arquivos)

| Arquivo | Mudanças | Impacto | Validação |
|---------|----------|---------|-----------|
| `docker-compose.yml` | `name`, container names, network names, env vars | 🟡 Média | `docker-compose config` |
| `docker-compose.apps.yml` | `name`, container names, network refs | 🟡 Média | `docker-compose config` |
| `docker-compose.llm.yml` | `name`, network refs | 🟡 Média | `docker-compose config` |
| `apps/api/Dockerfile` | Possíveis path refs | 🟢 Baixa | `docker build` test |
| `apps/web/Dockerfile` | Possíveis path refs | 🟢 Baixa | `docker build` test |

**Impacto**: Networks/volumes podem precisar recreate se nomes mudarem.

#### Category 4: Documentação (20+ arquivos)

| Tipo | Arquivos | Criticidade | Validação |
|------|----------|-------------|-----------|
| Agent instructions | 5 (`.github/agents/*.md`, copilot-instructions) | 🟢 Baixa | Manual review |
| Constitution | 2 (`.specify/constitution.md`, `memory/constitution.md`) | 🟡 Média | Manual review |
| Specs anteriores | 3 dirs (`001-*/`, `002-*/`, `003-*/`) | 🟢 Baixa | `git grep` |
| Memory/Status | 12+ (`epics/`, `tech-debt/`, STATUS.md) | 🟢 Baixa | `git grep` |
| README | 1 (`.github/README.md`) | 🟡 Média | Manual review |

**Impacto**: Inconsistências causam confusão, mas não quebram build.

#### Category 5: Generated/Cache Files (Regenerar)

| Arquivo | Ação | Criticidade |
|---------|------|-------------|
| `pnpm-lock.yaml` | Regenerar via `pnpm install` | 🔴 Alta |
| `node_modules/` | Rebuild completo | 🔴 Alta |
| `.turbo/` | Auto-rebuild por Turbo | 🟢 Baixa |

---

## 🎯 Considerações Técnicas Especiais

### pnpm Cache e Workspace Protocol

**Comportamento do `workspace:*`**:
- pnpm resolve `workspace:*` dependencies baseado no `name` em `package.json`
- Se `name` muda mas `workspace:*` permanece, pnpm não encontra o package
- **Solução**: Atualizar `name` E `dependencies` atomicamente

**Cache Invalidation**:
```bash
# Após rename, executar:
pnpm store prune  # Remove packages não mais referenciados
rm -rf node_modules pnpm-lock.yaml
pnpm install      # Fresh install com novos nomes
```

### Docker Compose Networks

**Comportamento de `name:` directive**:
- Mudar `name:` em `docker-compose.yml` cria um **novo projeto Docker Compose**
- Networks/volumes do projeto antigo permanecem órfãos
- **Solução**: `docker-compose down -v` antes de rename (se preservar dados não for crítico)

**Network References**:
- Se `multi-llm-network` → `synergy-network`, todos os serviços devem usar novo nome
- Services em diferentes compose files devem referenciar a mesma network name

### TypeScript Module Resolution

**Module Resolution Strategy**:
- TypeScript usa `package.json` `name` field para resolver bare imports
- Mudanças em `package.json` requerem IDE restart para Language Server re-index
- **Solução**: Após rename, executar `pnpm typecheck` para verificar resolução

**Path Aliases (se existirem)**:
- Verificar `tsconfig.json` para `paths` que possam referenciar `@multi-llm/*`
- Atualizar se necessário

### Biome Linter

**Auto-fix Capabilities**:
- Biome pode auto-organizar imports após rename
- **Comando**: `pnpm biome check --write .` após rename
- Verificar que nenhum erro de import não resolvido permanece

### Turbo Cache

**Build Cache Behavior**:
- Turbo hashes inputs (source files, package.json, dependencies)
- Rename invalida TODO o cache (todos os hashes mudam)
- **Impacto**: Primeiro build pós-rename será full rebuild (~2-5min dependendo da máquina)
- **Solução**: Aceitar como custo one-time, não há workaround

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Import esquecido quebra build** | 🟡 Média | 🔴 Alta | Usar script automatizado + `pnpm typecheck` |
| **pnpm cache corrupto** | 🟢 Baixa | 🟡 Média | `pnpm store prune` + fresh install |
| **Docker network conflict** | 🟢 Baixa | 🟡 Média | `docker-compose down -v` antes de rename |
| **CI/CD pipeline quebra** | 🟡 Média | 🔴 Alta | Testar localmente com `pnpm build` antes de push |
| **Desenvolvedor não atualiza branch** | 🟡 Média | 🟡 Média | Documentar em PR: "require fresh clone or clean install" |
| **Docs desatualizadas** | 🟡 Média | 🟢 Baixa | `git grep` validação final |

---

## 🚀 Ordem de Execução Recomendada

### Sequência de Camadas (Fail-Fast Approach)

```
1. Foundation Layer (package.json)
   ├─ Rename all 9 package.json `name` fields
   ├─ Update all dependencies to @synergy/*
   └─ ✅ Checkpoint: `pnpm install` completa

2. Dependency Layer (TypeScript imports)
   ├─ Update 61+ .ts/.tsx files
   └─ ✅ Checkpoint: `pnpm typecheck` passa

3. Build Layer
   ├─ `pnpm clean && pnpm install && pnpm build`
   └─ ✅ Checkpoint: build completa sem erros

4. Ops Layer (Docker)
   ├─ Update docker-compose*.yml (3 files)
   ├─ Update Dockerfiles (2 files)
   └─ ✅ Checkpoint: `docker-compose config` válido

5. Knowledge Layer (Documentação)
   ├─ Update .github/ docs (5 files)
   ├─ Update .specify/ memory (15+ files)
   └─ ✅ Checkpoint: `git grep` sem false positives

6. Finalization
   ├─ Regenerate lockfile
   ├─ `pnpm biome check --write`
   ├─ Full validation suite
   └─ Git commit
```

**Rationale da ordem**:
- **Foundation first**: Se packages não compilam, nada funciona
- **Dependencies second**: TypeScript deve resolver antes de build
- **Build third**: Confirma que código é válido antes de infra
- **Ops fourth**: Docker não afeta build local
- **Docs last**: Não bloqueante, pode ser iterativo

---

## ✅ Estratégia de Validação

### Checkpoint 1: Package Installation

```bash
pnpm install
echo $?  # Deve ser 0
```

**Critério de Sucesso**: 
- Nenhum erro "workspace package not found"
- Todos os symlinks em `node_modules/` criados

---

### Checkpoint 2: TypeScript Compilation

```bash
pnpm typecheck
echo $?  # Deve ser 0
```

**Critério de Sucesso**:
- Nenhum erro "Cannot find module '@multi-llm/...'"
- Nenhum erro de tipo

---

### Checkpoint 3: Full Build

```bash
pnpm clean
pnpm install
pnpm build
echo $?  # Deve ser 0
```

**Critério de Sucesso**:
- Todas as apps e packages compilam
- Arquivos `dist/` gerados

---

### Checkpoint 4: Docker Validation

```bash
docker-compose config
docker-compose -f docker-compose.apps.yml config
echo $?  # Deve ser 0
```

**Critério de Sucesso**:
- Nenhum warning de configuração
- Networks e volumes definidos corretamente

---

### Checkpoint 5: Import Cleanup

```bash
rg '@multi-llm/' apps packages --type ts --type tsx
echo $?  # Deve ser 1 (nenhum match)
```

**Critério de Sucesso**:
- Nenhum import antigo encontrado em código

---

### Checkpoint 6: Global Search

```bash
git grep -i "multi-llm" | grep -v ".git/" | grep -v "pnpm-lock.yaml" | wc -l
```

**Critério de Sucesso**:
- Apenas resultados justificados (ex: comentários "renamed from...")

---

### Checkpoint 7: Linting

```bash
pnpm biome check
echo $?  # Deve ser 0
```

**Critério de Sucesso**:
- Nenhum erro de lint relacionado a imports

---

## 📝 Plano de Rollback

### Cenário 1: Erro Durante Execução (Build Quebrado)

```bash
# Discard uncommitted changes
git reset --hard HEAD

# Restore node_modules
rm -rf node_modules
pnpm install

# Verify working state
pnpm build
```

---

### Cenário 2: Erro Após Commit (Descoberto Depois)

```bash
# Revert commit
git revert HEAD

# OU reset para commit anterior
git reset --hard HEAD~1

# Force push se necessário (cuidado!)
git push --force-with-lease
```

---

### Cenário 3: CI/CD Quebrado

```bash
# Localmente
git checkout main
git pull
git checkout 004-rename-to-synergy
git reset --hard origin/main

# Reabrir branch limpa
git checkout -b 004-rename-to-synergy-v2
```

---

## 🎓 Lições Aprendidas e Melhores Práticas

### DOs

✅ **Automatizar find/replace** - Scripts reproduzíveis reduzem erro humano
✅ **Validar incrementalmente** - Checkpoints detectam problemas cedo
✅ **Usar Git branches** - Isolamento permite experimentação segura
✅ **Clean install pós-rename** - Evita cache stale
✅ **Testar localmente primeiro** - Nunca confiar em "deve funcionar"

### DON'Ts

❌ **Editar manualmente 61 arquivos** - Alto risco de typo
❌ **Commitar sem validação** - Quebra CI/CD para todo o time
❌ **Ignorar Docker** - Devs que usam containers terão surpresas
❌ **Esquecer documentação** - Inconsistência causa confusão longo prazo
❌ **Reescrever histórico Git** - Commits antigos devem manter nome antigo

---

## 📦 Entregáveis da Fase 1

- [x] **quickstart.md** - Guia passo-a-passo de execução
- [x] **Análise de Impacto** - Tabela detalhada de arquivos afetados
- [x] **Estratégia de Validação** - 7 checkpoints com critérios de sucesso
- [x] **Plano de Rollback** - Procedimentos de recuperação
- [ ] **research.md** - Aguardando output da Fase 0 (será gerado por sub-agent)

---

## 🔄 Próximos Passos (Fase 2: Tasks)

**Após este plano ser aprovado**:

1. Executar `/speckit.tasks` para gerar `tasks.md` com checklist detalhada
2. Cada task será uma operação atômica (ex: "Rename apps/api/package.json")
3. Tasks terão ordem de dependência clara
4. Cada task terá comando de validação específico

**Não implementar ainda** - Fase de planejamento termina aqui. Implementação é responsabilidade do comando `/speckit.implement`.
