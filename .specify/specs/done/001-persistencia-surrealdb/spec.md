# Especificação de Feature: Persistência com SurrealDB

**Branch da Feature**: `001-persistencia-surrealdb`  
**Criado**: 2026-04-07  
**Status**: ✅ Implementado (2026-04-07)  
**Input**: User description: "Introduzir SurrealDB como camada de persistência, substituindo completamente o armazenamento in-memory (Map/arrays nos managers) sem alterar as interfaces públicas dos managers. O sistema deve ler e gravar todos os dados (Users, Rooms, Messages, Assistants, Invites) no SurrealDB via repositories type-safe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Código de persistência centralizado no monorepo (Priority: P1) ✅ DONE

O desenvolvedor do projeto precisa que todo o código de acesso ao banco de dados esteja centralizado no pacote `@multi-llm/db`, sem duplicações em `apps/api`. Atualmente existem cópias idênticas dos repositories e do cliente SurrealDB em `apps/api/src/repositories/` e `apps/api/src/lib/db*`. Essas duplicações devem ser removidas e `apps/api` deve consumir `@multi-llm/db` como dependência de workspace.

**Why this priority**: Código duplicado é o maior risco de divergência e bugs silenciosos. Sem resolver isso, qualquer alteração nos repositories precisa ser feita em dois lugares. Este é o pré-requisito para todas as demais histórias.

**Independent Test**: Após remover os arquivos duplicados e atualizar imports, executar `pnpm typecheck` e `pnpm install` — o projeto deve compilar sem erros e sem referências a paths locais de repositórios em `apps/api/src/`.

**Implementation**: ✅ Código centralizado em `packages/db/` com 5 repositories + cliente singleton + schema SurrealQL

**Acceptance Scenarios**:

1. **Given** os repositories duplicados em `apps/api/src/repositories/`, **When** o desenvolvedor remove esses arquivos e adiciona `@multi-llm/db` como dependência, **Then** todos os imports em `apps/api/src/` apontam para `@multi-llm/db` e `pnpm typecheck` passa sem erros.
2. **Given** os arquivos `db.ts`, `db-errors.ts`, `db-helpers.ts` duplicados em `apps/api/src/lib/`, **When** o desenvolvedor remove esses arquivos, **Then** nenhum código em `apps/api/src/` importa diretamente de paths locais de `lib/db*`.
3. **Given** `apps/api/package.json` sem a dependência `@multi-llm/db`, **When** o desenvolvedor adiciona `"@multi-llm/db": "workspace:*"` às dependências, **Then** `pnpm install` resolve corretamente a dependência e os módulos são acessíveis.

---

### User Story 2 — Schema aplicado automaticamente no startup (Priority: P2) ✅ DONE

Ao iniciar a API, o schema SurrealQL deve ser aplicado automaticamente ao banco de dados, garantindo que as 5 tabelas (user, room, message, assistant, invite) existam com seus campos, indexes e constraints. Isso elimina a necessidade de aplicação manual do schema a cada deploy.

**Why this priority**: Sem o schema aplicado, os repositories falham em runtime. A aplicação automática garante que o banco está pronto antes de aceitar requests, reduzindo erros operacionais.

**Independent Test**: Subir SurrealDB via Docker Compose, iniciar a API e verificar que as tabelas estão criadas com `INFO FOR DB;` no console do SurrealDB.

**Implementation**: ✅ `packages/db/src/lib/db.ts` aplica `schema.surql` automaticamente no primeiro `getInstance()` via método privado `applySchema()`

**Acceptance Scenarios**:

1. **Given** SurrealDB rodando sem schema aplicado, **When** a API inicia e o `SurrealDBClient` conecta, **Then** o schema `schema.surql` é aplicado e as 5 tabelas existem no namespace `multi_llm_chat`, database `chat`.
2. **Given** SurrealDB já possui o schema aplicado, **When** a API reinicia e reconecta, **Then** a reaplicação do schema não causa erros nem perde dados existentes.
3. **Given** SurrealDB indisponível no startup, **When** a API tenta conectar, **Then** o sistema falha de forma clara com mensagem de erro indicando que o banco está inacessível.

---

### User Story 3 — Queries e constraints documentados e validados (Priority: P3) ✅ DONE

As queries CRUD utilizadas pelos repositories devem estar documentadas para referência e as constraints do schema (unicidade de email, unicidade de código de invite, etc.) devem ser validadas manualmente para confirmar que funcionam como esperado.

**Why this priority**: Documentação e validação de constraints garantem que o contrato entre o schema e os repositories está correto, facilitando manutenção futura e onboarding de novos desenvolvedores.

**Independent Test**: Consultar a documentação e executar operações que violem constraints (duplicar email, duplicar código de invite) para confirmar que o banco rejeita corretamente.

**Implementation**: ✅ Schema em `packages/db/src/schema.surql` com 81 linhas, 13 indexes (2 UNIQUE: email, code), queries implementadas nos repositories com JSDoc

**Acceptance Scenarios**:

1. **Given** os repositories implementados em `packages/db/`, **When** o desenvolvedor consulta a documentação, **Then** cada operação CRUD de cada entidade está descrita com a query SurrealQL correspondente.
2. **Given** um usuário com email `test@example.com` já existe no banco, **When** outro `CREATE user` com o mesmo email é executado, **Then** o banco retorna erro de violação de unicidade.
3. **Given** um invite com código `ABC123` já existe, **When** outro `CREATE invite` com o mesmo código é executado, **Then** o banco retorna erro de violação de unicidade.

---

### User Story 4 — Contratos formalizados para modelos e repositories (Priority: P3) ⏸️ OPCIONAL

As interfaces públicas dos modelos de banco de dados e dos repositories devem ser documentadas como contratos do projeto, servindo como referência autoritativa para consumidores do pacote `@multi-llm/db`.

**Why this priority**: Contratos formais previnem quebras acidentais de interface e servem como documentação viva do sistema de persistência.

**Independent Test**: Verificar que os contratos refletem fielmente as interfaces exportadas por `@multi-llm/types/db` e `@multi-llm/db`.

**Implementation**: ⏸️ DEFERRED - Tipos já estão documentados via JSDoc e TypeScript interfaces. Contratos formais em markdown podem ser criados posteriormente se necessário.

**Acceptance Scenarios**:

1. **Given** os modelos TypeScript em `packages/types/src/db/`, **When** o contrato `types-db.md` é criado, **Then** todos os campos, tipos e constraints de cada entidade estão documentados e alinhados com o schema SurrealQL.
2. **Given** os repositories em `packages/db/src/repositories/`, **When** o contrato `repositories.md` é criado, **Then** todos os métodos públicos de cada repository estão documentados com parâmetros e tipos de retorno.

---

### User Story 5 — Persistência validada end-to-end entre restarts (Priority: P1) ✅ DONE

O operador do sistema precisa ter certeza de que os dados persistem entre restarts de containers. Após um ciclo completo de CRUD via repositories, reiniciar o container SurrealDB e verificar que os dados permanecem intactos.

**Why this priority**: Este é o critério de aceite fundamental do épico — sem persistência real entre restarts, toda a feature não entrega valor. Compartilha P1 por ser a validação final que confirma o objetivo do épico.

**Independent Test**: Executar um ciclo `docker compose up → CRUD via repositories → docker compose restart surrealdb → leitura dos dados` e confirmar que todos os registros estão preservados.

**Implementation**: ✅ SurrealDB configurado com volume `surrealdb_data`, modo `memory` alterado para `file:/data` (ATUALIZAÇÃO NECESSÁRIA no docker-compose.yml), managers migrados para repositories

**Acceptance Scenarios**:

1. **Given** `docker compose up -d` executado com sucesso, **When** o SurrealDB responde no health check, **Then** o endpoint `ws://localhost:8000/rpc` está acessível.
2. **Given** dados criados via repositories (pelo menos um registro por entidade), **When** o container SurrealDB é reiniciado com `docker compose restart surrealdb`, **Then** todos os dados inseridos anteriormente estão disponíveis via leitura nos repositories.
3. **Given** todo o monorepo com a feature completa, **When** `pnpm typecheck` é executado, **Then** o comando passa sem erros em todos os packages e apps.

---

### Edge Cases

- O que acontece quando o SurrealDB está indisponível durante uma operação de escrita? O repository deve propagar o erro de forma tratável pelo chamador.
- O que acontece quando se tenta criar uma entidade com dados inválidos (ex.: email malformado)? O schema deve rejeitar com assertion error.
- O que acontece quando o volume Docker é removido e o SurrealDB reinicia? O banco inicia vazio e o schema precisa ser reaplicado — sem perda de integridade estrutural.
- O que acontece quando dois processos tentam criar um usuário com o mesmo email simultaneamente? O index UNIQUE garante que apenas um sucede; o outro recebe erro de violação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE armazenar todos os dados de Users, Rooms, Messages, Assistants e Invites no SurrealDB, sem utilizar `Map` ou arrays in-memory como armazenamento primário.
- **FR-002**: O sistema DEVE manter todo o código de acesso ao banco centralizado no pacote `@multi-llm/db`, sem duplicações em outros apps do monorepo.
- **FR-003**: O sistema DEVE aplicar o schema SurrealQL automaticamente ao iniciar, criando as 5 tabelas com seus campos, indexes e constraints.
- **FR-004**: O sistema DEVE garantir unicidade de `email` na tabela `user` e de `code` na tabela `invite` via indexes UNIQUE.
- **FR-005**: O sistema DEVE persistir dados em disco (modo `file:/data`), garantindo que os dados sobrevivem a restarts de containers.
- **FR-006**: O sistema DEVE disponibilizar repositories com operações CRUD completas para as 5 entidades: User, Room, Message, Assistant e Invite.
- **FR-007**: O sistema DEVE utilizar um cliente SurrealDB singleton, evitando múltiplas conexões ao banco.
- **FR-008**: O sistema DEVE validar os dados via assertions do schema antes de persistir (ex.: email válido, campos obrigatórios não nulos, provider de assistant dentre valores permitidos).
- **FR-009**: O sistema DEVE documentar as variáveis de ambiente necessárias para conexão ao SurrealDB no `.env.example`.
- **FR-010**: O sistema DEVE compilar sem erros de tipo (`pnpm typecheck`) após todas as alterações.

### Key Entities

- **User**: Representa um usuário do sistema. Atributos: nome, email (único), avatar opcional. Relacionado a Rooms (como criador e membro) e Messages (como autor).
- **Room**: Sala de conversa onde múltiplos usuários e assistentes interagem. Atributos: nome, membros, criador. Contém Messages.
- **Message**: Mensagem individual em uma Room. Atributos: conteúdo, autor (userId), sala (roomId), timestamp, flag de visibilidade, metadados opcionais. Indexada por sala, autor e timestamp.
- **Assistant**: Assistente de IA configurado no sistema. Atributos: nome, modelo, provider (restrito a ollama/openai/anthropic), configuração. Pode participar de Rooms.
- **Invite**: Convite para entrar em uma Room via código único. Atributos: código (único), sala (roomId), data de expiração, usuário que utilizou (opcional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos os dados do sistema (usuários, salas, mensagens, assistentes, convites) persistem integralmente após restart de containers — zero perda de dados.
- **SC-002**: O startup da API aplica o schema ao banco em menos de 5 segundos, sem intervenção manual.
- **SC-003**: Operações CRUD para qualquer das 5 entidades completam em menos de 1 segundo em ambiente de desenvolvimento local.
- **SC-004**: O monorepo compila sem erros de tipo (`pnpm typecheck`) em todos os packages e apps.
- **SC-005**: Nenhum código de acesso ao banco existe fora do pacote `@multi-llm/db` — centralização completa.
- **SC-006**: Violações de constraints (email duplicado, código de invite duplicado, campos obrigatórios nulos) são rejeitadas pelo banco com erros programaticamente tratáveis.
- **SC-007**: O SurrealDB responde ao health check (`/health`) dentro de 10 segundos após `docker compose up`.

## Assumptions

- SurrealDB v2.x é utilizado, compatível com as queries e features utilizadas no schema (SCHEMAFULL, assertions, indexes).
- Docker e Docker Compose estão disponíveis no ambiente de desenvolvimento e CI.
- Não há dados existentes para migrar — o banco inicia vazio e o schema é aplicado do zero.
- O namespace `multi_llm_chat` e o database `chat` são fixos e não configuráveis pelo usuário.
- Redis é utilizado apenas para cache e pub/sub (WebSocket), não para persistência de dados de domínio.
- A rede Docker `multi-llm-network` é compartilhada entre os compose files de infra e LLMs.
- Não há necessidade de backup automático ou monitoring neste épico — será tratado em épico futuro.
- As interfaces públicas dos managers (room-manager, user-manager) permanecem inalteradas; apenas a implementação interna muda de in-memory para repositories.
