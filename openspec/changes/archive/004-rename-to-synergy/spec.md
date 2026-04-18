# Especificação de Feature: Renomear Projeto para Synergy

**Branch da Feature**: `004-rename-to-synergy`  
**Criado**: 2025-01-09  
**Status**: Draft  
**Input**: Descrição do usuário: "Criar spec completa para renomear o projeto de 'multi-llm' para 'synergy'."

## Cenários de Usuário & Testes *(obrigatório)*

### História de Usuário 1 - Desenvolvedores Podem Importar Packages com Novo Nome (Prioridade: P1)

Desenvolvedores que trabalham no projeto precisam importar e usar os packages internos utilizando o novo nome `@synergy/*` em vez de `@multi-llm/*`. Todos os imports existentes devem continuar funcionando sem quebras.

**Por que esta prioridade**: Esta é a mudança fundamental que afeta 100% do código. Sem isso, o projeto não compila e nenhuma outra funcionalidade funciona.

**Teste Independente**: Pode ser totalmente testado executando `pnpm install` seguido de `pnpm build` em todo o workspace. Se todos os packages compilarem sem erros de módulo não encontrado, a mudança foi bem-sucedida.

**Cenários de Aceitação**:

1. **Dado** que um desenvolvedor clona o repositório, **Quando** executa `pnpm install` e `pnpm build`, **Então** todos os 6 packages compilam sem erros de import
2. **Dado** que existe código importando `@synergy/types`, **Quando** o TypeScript resolve os tipos, **Então** as definições de tipo são encontradas corretamente
3. **Dado** que existem dependências cruzadas entre packages (ex: `@synergy/platform` depende de `@synergy/db`), **Quando** o build é executado, **Então** todas as dependências são resolvidas corretamente

---

### História de Usuário 2 - Build e CI/CD Funcionam com Novo Nome (Prioridade: P2)

O pipeline de build, containers Docker e processos de deployment devem funcionar corretamente com o novo nome do projeto. Desenvolvedores e sistemas de CI/CD devem poder buildar, testar e deployar a aplicação sem erros relacionados ao nome antigo.

**Por que esta prioridade**: Garante que a infraestrutura de desenvolvimento e deployment continue operacional. Sem isso, o projeto não pode ser deployado em produção.

**Teste Independente**: Pode ser testado executando `docker-compose up` e verificando que todos os containers iniciam corretamente, e executando o pipeline de CI/CD completo para confirmar que build, testes e lint passam.

**Cenários de Aceitação**:

1. **Dado** que os arquivos Docker Compose foram atualizados, **Quando** executa `docker-compose up`, **Então** todos os containers iniciam sem erros de configuração
2. **Dado** que o Dockerfile de cada app foi atualizado, **Quando** o build do container é executado, **Então** as imagens são criadas com os nomes corretos
3. **Dado** que existem scripts de CI/CD, **Quando** o pipeline é executado, **Então** todos os jobs completam com sucesso
4. **Dado** que existe configuração de linting, **Quando** executa `pnpm biome check`, **Então** nenhum erro relacionado a imports ou nomes é reportado

---

### História de Usuário 3 - Documentação Reflete Novo Nome (Prioridade: P3)

Toda documentação do projeto, incluindo README, guias, specs anteriores e instruções para agentes, deve usar consistentemente o nome "Synergy" em vez de "multi-llm". Novos colaboradores e usuários devem ver o nome correto em toda a documentação.

**Por que esta prioridade**: Garante consistência de marca e evita confusão para novos desenvolvedores. Menos crítico que funcionalidade, mas importante para profissionalismo e clareza.

**Teste Independente**: Pode ser testado realizando uma busca global por "multi-llm" em arquivos de documentação (.md) e verificando que nenhuma referência permanece (exceto em contextos históricos apropriados).

**Cenários de Aceitação**:

1. **Dado** que existe um README principal, **Quando** um desenvolvedor o lê, **Então** o nome do projeto é "Synergy" e não "multi-llm"
2. **Dado** que existem especificações anteriores em `.specify/specs/`, **Quando** um desenvolvedor as consulta, **Então** referências ao projeto usam "Synergy"
3. **Dado** que existem instruções para agentes em `.github/agents/`, **Quando** agentes IA consultam as instruções, **Então** o contexto do projeto é "Synergy"
4. **Dado** que existe um arquivo de constituição em `.specify/constitution.md`, **Quando** é consultado para princípios do projeto, **Então** o nome do projeto é "Synergy"

---

### Casos de Borda

- **O que acontece quando** existem referências ao nome antigo em commits do Git históricos?
  - **Resposta**: Commits históricos mantêm o nome "multi-llm" - isso é esperado e aceitável. O histórico do Git não deve ser reescrito.

- **O que acontece quando** o cache do pnpm contém referências aos packages antigos `@multi-llm/*`?
  - **Resposta**: Deve-se executar `pnpm store prune` seguido de `rm -rf node_modules pnpm-lock.yaml` e `pnpm install` para garantir que o cache seja limpo e o lockfile regenerado.

- **O que acontece quando** existem referências ao nome em variáveis de ambiente ou configuração de deployment?
  - **Resposta**: Variáveis de ambiente devem ser identificadas e atualizadas conforme necessário. Se houver deploy em produção, um plano de migração deve garantir que as novas variáveis sejam configuradas antes do deploy.

- **Como o sistema lida com** diferentes variações de capitalização do nome (kebab-case, Title Case, snake_case)?
  - **Resposta**: Todas as variações devem ser renomeadas consistentemente: `multi-llm` → `synergy`, `Multi-LLM` → `Synergy`, `@multi-llm/` → `@synergy/`, `multi_llm` → `synergy`.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

**Renomeação de Packages**

- **FR-001**: Sistema DEVE renomear os 6 packages do workspace de `@multi-llm/*` para `@synergy/*`, incluindo: `interaction`, `interpretation`, `maintenance`, `types`, `db`, e `platform`
- **FR-002**: Cada package.json dos 6 packages DEVE ter seu campo `name` atualizado de `@multi-llm/[nome]` para `@synergy/[nome]`

**Atualização de Imports**

- **FR-003**: Todos os arquivos TypeScript que importam de `@multi-llm/*` DEVEM ter seus imports atualizados para `@synergy/*`
- **FR-004**: Sistema DEVE garantir que aproximadamente 150+ arquivos com imports sejam identificados e atualizados
- **FR-005**: Nenhum import de `@multi-llm/*` DEVE permanecer após a conclusão da mudança

**Atualização de Dependencies**

- **FR-006**: Todos os package.json que listam packages internos como dependências DEVEM ser atualizados, incluindo: `apps/web/package.json`, `apps/api/package.json`, `apps/workers/package.json`, e packages que importam outros packages
- **FR-007**: Sistema DEVE garantir que o arquivo `pnpm-lock.yaml` seja regenerado para refletir os novos nomes de packages

**Infraestrutura Docker**

- **FR-008**: Arquivos Docker Compose DEVEM ser atualizados para usar o novo nome, incluindo: `docker-compose.yml`, `docker-compose.apps.yml`, `docker-compose.llm.yml`
- **FR-009**: Dockerfiles DEVEM ser atualizados, incluindo: `apps/api/Dockerfile`, `apps/web/Dockerfile`
- **FR-010**: Nomes de containers, networks e volumes DEVEM refletir o novo nome "synergy" onde aplicável

**Documentação**

- **FR-011**: Arquivos de documentação DEVEM ser atualizados para usar "Synergy", incluindo: `.specify/constitution.md`, `.github/README.md`, `.github/copilot-instructions.md`
- **FR-012**: Todos os agentes em `.github/agents/*.agent.md` DEVEM ter referências ao projeto atualizadas para "Synergy"
- **FR-013**: Todas as especificações em `.specify/specs/` DEVEM ter referências ao nome do projeto atualizadas
- **FR-014**: Todos os planos em `.specify/plans/` DEVEM ter referências ao nome do projeto atualizadas
- **FR-015**: Arquivos de memória em `.specify/memory/` DEVEM ser atualizados se contiverem referências ao nome do projeto

**Configurações de Workspace**

- **FR-016**: O `package.json` raiz DEVE ter seu campo `name` atualizado de `multi-llm` para `synergy`
- **FR-017**: Configurações de workspace no `package.json` raiz DEVEM ser mantidas funcionais
- **FR-018**: O arquivo `pnpm-workspace.yaml` DEVE continuar referenciando os mesmos diretórios de packages (paths não mudam, apenas nomes internos)
- **FR-019**: Se `turbo.json` contiver referências a nomes de packages, DEVEM ser atualizadas

**Consistência de Nomenclatura**

- **FR-020**: Todas as variações do nome DEVEM ser tratadas consistentemente:
  - `multi-llm` (kebab-case) → `synergy`
  - `@multi-llm/` (npm scope) → `@synergy/`
  - `Multi-LLM` (Title Case) → `Synergy`
  - `multi_llm` (snake_case, se existir) → `synergy`

### Entidades Chave

- **Package**: Unidade de código reutilizável no monorepo. Possui um `package.json` com nome único no formato `@scope/nome`. Pode depender de outros packages internos ou externos.

- **Import Statement**: Declaração em código TypeScript que referencia outro módulo. Usa o nome do package conforme definido em `package.json`. Deve corresponder exatamente ao nome publicado.

- **Dependency Declaration**: Entrada no `package.json` que especifica dependência de outro package. Para packages internos, usa o formato `@scope/nome` com a versão `workspace:*`.

- **Docker Service**: Serviço definido em arquivo Docker Compose com nome único. Pode ter networks, volumes e variáveis de ambiente associadas.

- **Documentation File**: Arquivo markdown contendo informações sobre o projeto, incluindo nome, propósito e instruções de uso.

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: Nenhuma string "multi-llm", "@multi-llm/", "Multi-LLM" ou "multi_llm" permanece em arquivos de código, configuração ou documentação (exceto histórico do Git)
- **SC-002**: O comando `pnpm build` completa com sucesso para todos os packages sem erros de módulo não encontrado
- **SC-003**: Se existir suite de testes, o comando `pnpm test` completa com 100% dos testes passando
- **SC-004**: O comando `pnpm biome check` completa sem erros relacionados a imports, nomes ou linting
- **SC-005**: O comando `docker-compose up` inicia todos os containers sem erros de configuração
- **SC-006**: Uma busca global por `git grep -i "multi-llm"` retorna apenas resultados em contextos históricos apropriados (ex: descrições de commits antigos, se presentes em algum changelog)
- **SC-007**: O arquivo `pnpm-lock.yaml` foi regenerado e contém apenas referências a `@synergy/*` para packages internos

## Premissas

- O projeto utiliza pnpm workspaces para gerenciamento de monorepo
- O TypeScript é a linguagem principal e todos os imports seguem sintaxe ES modules
- Não existem packages já publicados no npm registry com o nome `@synergy/*` (ou existe permissão para usar este scope)
- O projeto usa Biome para linting e formatação de código
- Docker e Docker Compose estão sendo usados para containerização
- A renomeação é uma mudança de nomenclatura interna/privada e não afeta APIs públicas ou usuários finais externos (se houver)
- Variáveis de ambiente, se afetadas, são documentadas em arquivos `.env.example` ou documentação de deployment
- O repositório Git está em branch dedicada para esta mudança, permitindo revisão antes de merge
- Não há integração com sistemas externos que dependam especificamente do nome "multi-llm" em suas configurações
